import { UserProfile } from '../types/user';
import { ExecutorInformation } from '../types/executor';
import { BeneficiaryInformation } from '../types/beneficiary';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { theme } from '../config/theme.config';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

/**
 * Generate a detailed HTML will document with MiWill branding
 */
export async function generateWillHTML(
  userProfile: UserProfile,
  executor: ExecutorInformation | null,
  beneficiaries: BeneficiaryInformation[],
  assets: AssetInformation[],
  policies: PolicyInformation[],
  assetBeneficiaryLinks: Record<string, Record<string, number>>,
  policyBeneficiaryLinks: Record<string, Record<string, number>>
): Promise<string> {
  const getUserFullName = () => {
    return `${userProfile.first_name || ''} ${userProfile.surname || ''}`.trim() || userProfile.full_name || '';
  };

  const getUserAddress = () => {
    if (userProfile?.address && userProfile.address.trim()) {
      return userProfile.address.trim();
    }
    return 'Not specified';
  };

  const getExecutorName = () => {
    if (!executor) return 'MiWill Executor Services';
    return executor.executor_name || 
      `${executor.executor_first_name || ''} ${executor.executor_surname || ''}`.trim() || 
      'MiWill Executor Services';
  };

  const getExecutorIdNumber = () => {
    return executor?.executor_id_number || 'Not specified';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Load logo as base64
  let logoBase64 = '';
  try {
    // Load the logo asset using expo-asset
    const logoAssetModule = require('../../assets/logo1.png');
    const asset = Asset.fromModule(logoAssetModule);
    await asset.downloadAsync();
    
    if (asset.localUri) {
      try {
        const base64 = await FileSystemLegacy.readAsStringAsync(asset.localUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        logoBase64 = `data:image/png;base64,${base64}`;
      } catch (fsError) {
        console.warn('Could not read logo file:', fsError);
      }
    }
  } catch (error) {
    console.warn('Could not load logo asset:', error);
    // Continue without logo - the will will still be generated
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate estate value
  const estateValue = assets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0) +
    policies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);

  const estateWideBeneficiaries = beneficiaries.filter(
    (beneficiary) => beneficiary.inherit_entire_estate
  );
  const clauseBeneficiaries = estateWideBeneficiaries.length > 0 ? estateWideBeneficiaries : beneficiaries;
  const hasEstateWideBeneficiaries = estateWideBeneficiaries.length > 0;

  // Build assets section with beneficiaries
  let assetsSection = '';
  if (hasEstateWideBeneficiaries && assets.length === 0) {
    // If there are estate-wide beneficiaries but no assets, show clause explaining all assets go to them
    assetsSection = '<div class="clause-section"><h3 class="clause-number">4. SPECIFIC BEQUESTS - ASSETS</h3>';
    assetsSection += '<p class="clause-text">I hereby bequeath the remainder of my Assets, including all Assets that I may own at the time of my death, to my estate-wide beneficiaries as specified in clause 3.1 above, in equal shares.</p>';
    
    if (estateWideBeneficiaries.length > 0) {
      assetsSection += '<p class="clause-text"><strong>Estate-wide Beneficiaries:</strong></p>';
      assetsSection += '<ul class="allocation-list">';
      estateWideBeneficiaries.forEach(ben => {
        const beneficiaryName = ben.beneficiary_name || 
          `${ben.beneficiary_first_name || ''} ${ben.beneficiary_surname || ''}`.trim() ||
          'Unnamed Beneficiary';
        assetsSection += `<li><strong>${beneficiaryName}</strong></li>`;
      });
      assetsSection += `</ul>`;
    }
    
    assetsSection += '</div>';
  } else if (assets.length > 0 && !hasEstateWideBeneficiaries) {
    assetsSection = '<div class="clause-section"><h3 class="clause-number">4. SPECIFIC BEQUESTS - ASSETS</h3>';
    assetsSection += '<p class="clause-text">I hereby bequeath the following Assets to the beneficiaries as specified:</p>';
    
    assets.forEach(asset => {
      const assetName = asset.asset_name || 'Unnamed Asset';
      const assetType = asset.asset_type || 'Asset';
      const assetValue = formatCurrency(asset.asset_value || 0);
      const assetDescription = asset.asset_description || 'No description provided';
      
      const links = assetBeneficiaryLinks[asset.asset_id] || {};
      const linkedBeneficiaries = beneficiaries.filter(b => links[b.beneficiary_id]);
      
      assetsSection += `<div class="asset-entry">`;
      assetsSection += `<p class="asset-title"><strong>${assetName}</strong> (${assetType})</p>`;
      assetsSection += `<p class="asset-details">Value: ${assetValue}</p>`;
      assetsSection += `<p class="asset-details">Description: ${assetDescription}</p>`;
      
      if (linkedBeneficiaries.length > 0) {
        assetsSection += `<p class="asset-details"><strong>Allocation:</strong></p>`;
        assetsSection += `<ul class="allocation-list">`;
        linkedBeneficiaries.forEach(ben => {
          const percentage = links[ben.beneficiary_id] || 0;
          const beneficiaryName = ben.beneficiary_name || 
            `${ben.beneficiary_first_name || ''} ${ben.beneficiary_surname || ''}`.trim() ||
            'Unnamed Beneficiary';
          assetsSection += `<li><strong>${beneficiaryName}</strong> - ${percentage}%</li>`;
        });
        assetsSection += `</ul>`;
      } else {
        assetsSection += `<p class="asset-details">No beneficiaries assigned yet.</p>`;
      }
      assetsSection += `</div>`;
    });
    
    assetsSection += '</div>';
  }

  // Build policies section with beneficiaries
  let policiesSection = '';
  if (hasEstateWideBeneficiaries && policies.length === 0) {
    // If there are estate-wide beneficiaries but no policies, show clause explaining all policies go to them
    policiesSection = '<div class="clause-section"><h3 class="clause-number">5. SPECIFIC BEQUESTS - POLICIES</h3>';
    policiesSection += '<p class="clause-text">I hereby bequeath the remainder of my Policies, including all Policies that I may own at the time of my death, to my estate-wide beneficiaries as specified in clause 3.1 above, in equal shares.</p>';
    
    if (estateWideBeneficiaries.length > 0) {
      policiesSection += '<p class="clause-text"><strong>Estate-wide Beneficiaries:</strong></p>';
      policiesSection += '<ul class="allocation-list">';
      estateWideBeneficiaries.forEach(ben => {
        const beneficiaryName = ben.beneficiary_name || 
          `${ben.beneficiary_first_name || ''} ${ben.beneficiary_surname || ''}`.trim() ||
          'Unnamed Beneficiary';
        policiesSection += `<li><strong>${beneficiaryName}</strong></li>`;
      });
      policiesSection += `</ul>`;
    }
    
    policiesSection += '</div>';
  } else if (policies.length > 0 && !hasEstateWideBeneficiaries) {
    policiesSection = '<div class="clause-section"><h3 class="clause-number">4. SPECIFIC BEQUESTS - POLICIES</h3>';
    policiesSection += '<p class="clause-text">I hereby bequeath the following Policies to the beneficiaries as specified:</p>';
    
    policies.forEach(policy => {
      const policyType = policy.policy_type || 'Policy';
      const policyValue = formatCurrency(policy.policy_value || 0);
      const insuranceCompany = policy.insurance_company || 'Not specified';
      const policyDescription = policy.policy_description || 'No description provided';
      
      const links = policyBeneficiaryLinks[policy.policy_id] || {};
      const linkedBeneficiaries = beneficiaries.filter(b => links[b.beneficiary_id]);
      
      policiesSection += `<div class="policy-entry">`;
      policiesSection += `<p class="policy-title"><strong>${policyType}</strong></p>`;
      policiesSection += `<p class="policy-details">Insurance Company: ${insuranceCompany}</p>`;
      policiesSection += `<p class="policy-details">Value: ${policyValue}</p>`;
      policiesSection += `<p class="policy-details">Description: ${policyDescription}</p>`;
      
      if (linkedBeneficiaries.length > 0) {
        policiesSection += `<p class="policy-details"><strong>Allocation:</strong></p>`;
        policiesSection += `<ul class="allocation-list">`;
        linkedBeneficiaries.forEach(ben => {
          const percentage = links[ben.beneficiary_id] || 0;
          const beneficiaryName = ben.beneficiary_name || 
            `${ben.beneficiary_first_name || ''} ${ben.beneficiary_surname || ''}`.trim() ||
            'Unnamed Beneficiary';
          policiesSection += `<li><strong>${beneficiaryName}</strong> - ${percentage}%</li>`;
        });
        policiesSection += `</ul>`;
      } else {
        policiesSection += `<p class="policy-details">No beneficiaries assigned yet.</p>`;
      }
      policiesSection += `</div>`;
    });
    
    policiesSection += '</div>';
  }

  // Build beneficiaries list for clause 4.2 - matching traditional format
  let beneficiariesList = '';
  clauseBeneficiaries.forEach((beneficiary, index) => {
    const beneficiaryName = beneficiary.beneficiary_name || 
      `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_surname || ''}`.trim() ||
      'Unnamed Beneficiary';
    const prefix = index === 0 ? '' : 'and ';
    const beneficiaryIdNumber = beneficiary.beneficiary_id_number || 'Not specified';
    
    beneficiariesList += `<p class="clause-text">`;
    beneficiariesList += `${prefix}<span class="blank-line">${beneficiaryName}</span>`;
    beneficiariesList += `</p>`;
    beneficiariesList += `<div class="user-info-row">`;
    beneficiariesList += `<div class="user-info-left"></div>`;
    beneficiariesList += `<div class="user-info-right">ID Number: <span class="blank-line">${beneficiaryIdNumber}</span></div>`;
    beneficiariesList += `</div>`;
  });

  const clauseSoleHeir = clauseBeneficiaries.length === 1 ? clauseBeneficiaries[0] : null;
  const soleHeirIsSpouse = clauseSoleHeir?.relationship_to_user?.toLowerCase().includes('spouse');
  const shouldUseSoleHeir = !!clauseSoleHeir;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Last Will and Testament</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      color: ${theme.colors.text};
      background-color: #FFFFFF;
      line-height: 1.75;
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${theme.colors.border};
    }
    .logo {
      width: 150px;
      height: 150px;
      margin: 0 auto 20px;
      display: block;
      object-fit: contain;
    }
    .brand-name {
      font-size: 32px;
      font-weight: 700;
      color: ${theme.colors.textSecondary};
      letter-spacing: 2px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 14px;
      color: ${theme.colors.primary};
      font-weight: 600;
      letter-spacing: 1px;
    }
    .will-title {
      font-size: 32px;
      font-weight: 700;
      color: ${theme.colors.primary};
      text-align: center;
      margin: 40px 0 30px 0;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .user-info {
      margin-bottom: 30px;
    }
    .user-info p {
      margin-bottom: 12px;
      font-size: 15px;
      line-height: 1.75;
    }
    .user-info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .user-info-left {
      flex: 1;
    }
    .user-info-right {
      text-align: right;
      margin-left: 20px;
    }
    .blank-line {
      border-bottom: 1px solid ${theme.colors.text};
      display: inline-block;
      min-width: 200px;
      padding-bottom: 2px;
      margin-right: 8px;
    }
    .editable-field {
      cursor: pointer;
      position: relative;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .editable-field:hover {
      background-color: ${theme.colors.primary}15;
    }
    .clause-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .clause-number {
      font-size: 16px;
      font-weight: 700;
      color: ${theme.colors.text};
      margin-bottom: 8px;
      display: inline-block;
    }
    .clause-text {
      font-size: 15px;
      color: ${theme.colors.text};
      line-height: 1.75;
      margin-left: 20px;
      margin-bottom: 12px;
    }
    .clause-note {
      font-size: 13px;
      color: ${theme.colors.textSecondary};
      font-style: italic;
      margin-left: 20px;
      margin-bottom: 12px;
    }
    .sub-clause-section {
      margin-left: 40px;
      margin-top: 12px;
    }
    .sub-clause-number {
      font-size: 16px;
      font-weight: 700;
      color: ${theme.colors.text};
      margin-bottom: 8px;
    }
    .beneficiary-entry {
      margin-left: 20px;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .executor-info {
      margin-left: 20px;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .asset-entry, .policy-entry {
      margin-left: 20px;
      margin-top: 16px;
      margin-bottom: 16px;
      padding: 16px;
      background-color: ${theme.colors.surface};
      border-radius: 8px;
      border-left: 4px solid ${theme.colors.primary};
    }
    .asset-title, .policy-title {
      font-size: 16px;
      font-weight: 700;
      color: ${theme.colors.primary};
      margin-bottom: 8px;
    }
    .asset-details, .policy-details {
      font-size: 14px;
      color: ${theme.colors.text};
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .allocation-list {
      margin-left: 20px;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    .allocation-list li {
      margin-bottom: 4px;
      font-size: 14px;
    }
    .estate-summary {
      margin: 30px 0;
      padding: 20px;
      background-color: ${theme.colors.primary}15;
      border-radius: 8px;
      border-left: 4px solid ${theme.colors.primary};
    }
    .estate-summary h3 {
      font-size: 16px;
      font-weight: 700;
      color: ${theme.colors.primary};
      margin-bottom: 12px;
    }
    .estate-summary p {
      font-size: 14px;
      color: ${theme.colors.text};
      margin-bottom: 6px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${theme.colors.border};
      text-align: center;
    }
    .signature-section {
      margin-top: 40px;
      padding: 20px;
    }
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid ${theme.colors.text};
      padding-top: 8px;
      font-weight: 700;
    }
    .page-number {
      text-align: right;
      font-size: 12px;
      color: ${theme.colors.textSecondary};
      margin-top: 20px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .clause-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="MiWill Logo" class="logo" />` : ''}
  </div>

  <h1 class="will-title">LAST WILL AND TESTAMENT</h1>

  <div class="user-info">
    <p>This is the Last Will and Testament of <span class="blank-line">${getUserFullName()}</span></p>
    <div class="user-info-row">
      <div class="user-info-left"></div>
      <div class="user-info-right">ID Number: <span class="blank-line">${userProfile.id_number || ''}</span></div>
    </div>
    <p>Currently residing at <span class="blank-line">${getUserAddress()}</span></p>
  </div>

  <div class="clause-section">
    <h3 class="clause-number">1.</h3>
    <p class="clause-text">
      I hereby declare this to be my Last Will and Testament. I hereby revoke and annul all previous Wills, Codicils and all other documents of a testamentary nature heretofore made or executed by me.
    </p>
  </div>

  <div class="clause-section">
    <h3 class="clause-number">2.</h3>
    <p class="clause-text">
      I nominate and appoint
    </p>
    <div class="executor-info">
      <p class="clause-text"><span class="blank-line">${getExecutorName()}</span></p>
      <div class="user-info-row">
        <div class="user-info-left"></div>
        <div class="user-info-right">ID Number: <span class="blank-line">${getExecutorIdNumber()}</span></div>
      </div>
    </div>
    <p class="clause-text">
      as Executor of my Will granting unto him/her such power and authority as is allowed in law especially that of assumption. I specifically direct that it shall not be necessary for my Executor to give security to the Master of the High Court for the due fulfilment of his/her functions in terms hereof.
    </p>
  </div>

  ${beneficiaries.some(b => b.relationship_to_user?.toLowerCase().includes('child')) ? `
  <div class="clause-section">
    <h3 class="clause-number">3.</h3>
    <p class="clause-text">
      In the event of me and <span class="blank-line">${beneficiaries.find(b => b.relationship_to_user?.toLowerCase().includes('spouse'))?.beneficiary_name || 'my spouse'}</span>
    </p>
    <p class="clause-text">
      dying simultaneously, I nominate and appoint
    </p>
    <div class="executor-info">
      <p class="clause-text"><span class="blank-line">${getExecutorName()}</span></p>
      <div class="user-info-row">
        <div class="user-info-left"></div>
        <div class="user-info-right">ID Number: <span class="blank-line">${getExecutorIdNumber()}</span></div>
      </div>
    </div>
    <p class="clause-text">
      as legal guardians over our minor children and direct that he/she/they be exempted from furnishing security to the Master of the High Court for the due fulfilment of his/her/their functions in terms thereof.
    </p>
  </div>
  ` : ''}

  <div class="clause-section">
    <h3 class="clause-number">3.</h3>
    <p class="clause-note">(Delete either clause 3.1. or 3.2, whichever is not applicable).</p>
    ${shouldUseSoleHeir && clauseSoleHeir ? `
    <div class="sub-clause-section">
      <h4 class="sub-clause-number">3.1</h4>
      <p class="clause-text">
        As the sole heir / heiress to my estate, I nominate and appoint ${soleHeirIsSpouse ? 'my spouse' : ''}
      </p>
      <p class="clause-text">
        <span class="blank-line">${clauseSoleHeir.beneficiary_name || 
          `${clauseSoleHeir.beneficiary_first_name || ''} ${clauseSoleHeir.beneficiary_surname || ''}`.trim()}</span>
      </p>
      <div class="user-info-row">
        <div class="user-info-left"></div>
        <div class="user-info-right">ID Number: <span class="blank-line">${clauseSoleHeir.beneficiary_id_number || 'Not specified'}</span></div>
      </div>
      <p class="clause-text">
        subject to the conditions of clause 5 hereafter.
      </p>
    </div>
    ` : clauseBeneficiaries.length > 0 ? `
    <div class="sub-clause-section">
      <h4 class="sub-clause-number">3.1</h4>
      <p class="clause-text">
        I appoint the following beneficiaries as the joint heirs and heiresses to my Estate in equal shares
      </p>
      ${beneficiariesList}
      <p class="clause-text">
        ${hasEstateWideBeneficiaries ? 'They shall inherit my entire estate in equal shares.' : 'subject to the conditions of clause 4 hereafter.'} Should any of my aforesaid beneficiaries pre-decease me without leaving descendants, I direct that his or her share shall devolve upon the others.
      </p>
    </div>
    ` : `
    <p class="clause-text">No beneficiaries have been appointed yet.</p>
    `}
  </div>

  <div class="clause-section">
    <h3 class="clause-number">3.2</h3>
    <p class="clause-text">
      Should any of my beneficiaries predecease me, or fail to accept their inheritance, then such inheritance shall devolve upon their lawful descendants per stirpes.
    </p>
  </div>

  ${assetsSection ? assetsSection.replace('4. SPECIFIC BEQUESTS - ASSETS', '4. SPECIFIC BEQUESTS - ASSETS') : ''}

  ${policiesSection ? policiesSection.replace('4. SPECIFIC BEQUESTS - POLICIES', '5. SPECIFIC BEQUESTS - POLICIES') : ''}

  ${!hasEstateWideBeneficiaries && (assets.length > 0 || policies.length > 0) ? `
  <div class="estate-summary">
    <h3>ESTATE SUMMARY</h3>
    <p><strong>Total Estate Value:</strong> ${formatCurrency(estateValue)}</p>
    <p><strong>Total Assets:</strong> ${assets.length}</p>
    <p><strong>Total Policies:</strong> ${policies.length}</p>
    <p><strong>Total Beneficiaries:</strong> ${beneficiaries.length}</p>
  </div>
  ` : ''}

  <div class="signature-section">
    <p class="clause-text">
      SIGNED at <strong>${getUserAddress().split(',')[0] || 'South Africa'}</strong> on this <strong>${currentDate.getDate()}</strong> day of <strong>${currentDate.toLocaleDateString('en-ZA', { month: 'long' })} ${currentDate.getFullYear()}</strong>.
    </p>
    <div class="signature-line">
      TESTATOR
    </div>
  </div>

  <div class="footer">
    <div class="page-number">Page 1 of 1</div>
    <p style="font-size: 12px; color: ${theme.colors.textSecondary}; margin-top: 20px;">
      This document was generated by MiWill on ${formattedDate}
    </p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Save will HTML to a file and return the URI
 */
export async function saveWillHTML(htmlContent: string): Promise<string> {
  const documentDirectory = FileSystemLegacy.documentDirectory || FileSystemLegacy.cacheDirectory;
  const fileName = `will_${Date.now()}.html`;
  const fileUri = `${documentDirectory}${fileName}`;
  
  await FileSystemLegacy.writeAsStringAsync(fileUri, htmlContent, {
    encoding: 'utf8' as any,
  });
  
  return fileUri;
}

