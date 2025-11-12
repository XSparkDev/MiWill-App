import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { AssetPolicyModal } from '../components/AssetPolicyModal';
import SideMenu from '../components/SideMenu';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/userService';
import AssetService from '../services/assetService';
import PolicyService from '../services/policyService';
import BeneficiaryService from '../services/beneficiaryService';
import WillService from '../services/willService';
import { UserProfile } from '../types/user';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import { formatSAPhoneNumber, isValidSAPhoneNumber } from '../utils/phoneFormatter';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const [showAssetPolicyModal, setShowAssetPolicyModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assetsCount, setAssetsCount] = useState(0);
  const [policiesCount, setPoliciesCount] = useState(0);
  const [beneficiariesCount, setBeneficiariesCount] = useState(0);
  const [hasWill, setHasWill] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetInformation[]>([]);
  const [policies, setPolicies] = useState<PolicyInformation[]>([]);
  const [assetBeneficiaries, setAssetBeneficiaries] =
    useState<Record<string, BeneficiaryInformation[]>>({});
  const [policyBeneficiaries, setPolicyBeneficiaries] =
    useState<Record<string, BeneficiaryInformation[]>>({});
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const [selectedManagement, setSelectedManagement] = useState<'assets' | 'policies' | null>(null);
  const [showBeneficiariesModal, setShowBeneficiariesModal] = useState(false);
  const [inlineTarget, setInlineTarget] =
    useState<{ type: 'asset' | 'policy'; id: string } | null>(null);
  const [inlineForm, setInlineForm] = useState({
    firstName: '',
    surname: '',
    relationship: '',
    email: '',
    phone: '',
  });
  const [inlineSaving, setInlineSaving] = useState(false);

  const beneficiarySummaries = useMemo(() => {
    const summaries: Record<
      string,
      {
        beneficiary: BeneficiaryInformation;
        assets: AssetInformation[];
        policies: PolicyInformation[];
      }
    > = {};

    Object.entries(assetBeneficiaries).forEach(([assetId, beneficiaries]) => {
      const asset = assets.find(item => item.asset_id === assetId);
      if (!asset) return;

      beneficiaries.forEach(beneficiary => {
        if (!summaries[beneficiary.beneficiary_id]) {
          summaries[beneficiary.beneficiary_id] = {
            beneficiary,
            assets: [],
            policies: [],
          };
        }
        summaries[beneficiary.beneficiary_id].assets.push(asset);
      });
    });

    Object.entries(policyBeneficiaries).forEach(([policyId, beneficiaries]) => {
      const policy = policies.find(item => item.policy_id === policyId);
      if (!policy) return;

      beneficiaries.forEach(beneficiary => {
        if (!summaries[beneficiary.beneficiary_id]) {
          summaries[beneficiary.beneficiary_id] = {
            beneficiary,
            assets: [],
            policies: [],
          };
        }
        summaries[beneficiary.beneficiary_id].policies.push(policy);
      });
    });

    return Object.values(summaries).sort((a, b) => {
      const nameA =
        a.beneficiary.beneficiary_name ||
        `${a.beneficiary.beneficiary_first_name || ''} ${a.beneficiary.beneficiary_surname || ''}`.trim();
      const nameB =
        b.beneficiary.beneficiary_name ||
        `${b.beneficiary.beneficiary_first_name || ''} ${b.beneficiary.beneficiary_surname || ''}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [assetBeneficiaries, policyBeneficiaries, assets, policies]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    } else {
      navigation.navigate('Login');
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const profile = await UserService.getUserById(currentUser.uid);
      setUserProfile(profile);

      // Fetch assets
      const userAssets = await AssetService.getUserAssets(currentUser.uid);
      setAssets(userAssets);
      setAssetsCount(userAssets.length);

      // Fetch policies
      const userPolicies = await PolicyService.getUserPolicies(currentUser.uid);
      setPolicies(userPolicies);
      setPoliciesCount(userPolicies.length);

      // Fetch beneficiaries count
      const beneficiaries = await BeneficiaryService.getUserBeneficiaries(currentUser.uid);
      setBeneficiariesCount(beneficiaries.length);

      // Check if user has uploaded a will
      const wills = await WillService.getUserWills(currentUser.uid);
      setHasWill(wills.length > 0);

      const assetBeneficiariesEntries = await Promise.all(
        userAssets.map(asset => BeneficiaryService.getBeneficiariesForAsset(asset.asset_id))
      );
      const assetBeneficiariesMap = userAssets.reduce<Record<string, BeneficiaryInformation[]>>(
        (acc, asset, index) => {
          acc[asset.asset_id] = assetBeneficiariesEntries[index] || [];
          return acc;
        },
        {}
      );
      setAssetBeneficiaries(assetBeneficiariesMap);
      setExpandedAssets(prev =>
        userAssets.reduce<Record<string, boolean>>((acc, asset) => {
          acc[asset.asset_id] = prev[asset.asset_id] || false;
          return acc;
        }, {})
      );

      const policyBeneficiariesEntries = await Promise.all(
        userPolicies.map(policy => BeneficiaryService.getBeneficiariesForPolicy(policy.policy_id))
      );
      const policyBeneficiariesMap = userPolicies.reduce<Record<string, BeneficiaryInformation[]>>(
        (acc, policy, index) => {
          acc[policy.policy_id] = policyBeneficiariesEntries[index] || [];
          return acc;
        },
        {}
      );
      setPolicyBeneficiaries(policyBeneficiariesMap);
      setExpandedPolicies(prev =>
        userPolicies.reduce<Record<string, boolean>>((acc, policy) => {
          acc[policy.policy_id] = prev[policy.policy_id] || false;
          return acc;
        }, {})
      );
      setInlineTarget(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddAssetPolicy = () => {
    setShowAssetPolicyModal(true);
  };

  const handleAddAsset = () => {
    setShowAssetPolicyModal(false);
    navigation.navigate('AddAsset');
  };

  const handleAddPolicy = () => {
    setShowAssetPolicyModal(false);
    navigation.navigate('AddPolicy');
  };

  const handleAddBeneficiary = () => {
    if (assetsCount === 0 && policiesCount === 0) {
      setToastMessage('You need to have Assets/Policies in order for you to add a beneficiary');
      setToastType('error');
      setShowToast(true);
      return;
    }
    navigation.navigate('AddBeneficiary');
  };

  const handleUploadWill = () => {
    navigation.navigate('UploadWill');
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const toggleAssetRow = (assetId: string) => {
    setExpandedAssets(prev => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  const togglePolicyRow = (policyId: string) => {
    setExpandedPolicies(prev => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  const beginInlineAdd = (type: 'asset' | 'policy', id: string) => {
    setInlineTarget({ type, id });
    setInlineForm({
      firstName: '',
      surname: '',
      relationship: '',
      email: '',
      phone: '',
    });
  };

  const cancelInlineAdd = () => {
    setInlineTarget(null);
    setInlineForm({
      firstName: '',
      surname: '',
      relationship: '',
      email: '',
      phone: '',
    });
  };

  const updateInlineForm = (field: keyof typeof inlineForm, value: string) => {
    setInlineForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineSave = async () => {
    if (!inlineTarget || !currentUser) return;

    const { firstName, surname, relationship, email, phone } = inlineForm;

    if (!firstName.trim()) {
      setToastMessage('Please enter beneficiary first name.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!surname.trim()) {
      setToastMessage('Please enter beneficiary surname.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!relationship.trim()) {
      setToastMessage('Please enter relationship.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (phone.trim() && !isValidSAPhoneNumber(phone.trim())) {
      setToastMessage('Please enter a valid South African phone number.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setInlineSaving(true);
    try {
      const formattedPhone = phone.trim() ? formatSAPhoneNumber(phone.trim()) : undefined;
      const beneficiaryId = await BeneficiaryService.createBeneficiary({
        user_id: currentUser.uid,
        beneficiary_first_name: firstName.trim(),
        beneficiary_surname: surname.trim(),
        beneficiary_name: `${firstName.trim()} ${surname.trim()}`.trim(),
        beneficiary_email: email.trim() || undefined,
        beneficiary_phone: formattedPhone,
        relationship_to_user: relationship.trim(),
        is_primary: false,
        is_verified: false,
        verification_token: '',
      });

      if (inlineTarget.type === 'asset') {
        await BeneficiaryService.linkAssetToBeneficiary(inlineTarget.id, beneficiaryId, 100, 'equal_split');
        setAssetBeneficiaries(prev => ({
          ...prev,
          [inlineTarget.id]: [
            ...(prev[inlineTarget.id] || []),
            {
              beneficiary_id: beneficiaryId,
              beneficiary_first_name: firstName.trim(),
              beneficiary_surname: surname.trim(),
              beneficiary_name: `${firstName.trim()} ${surname.trim()}`.trim(),
              beneficiary_email: email.trim(),
              beneficiary_phone: formattedPhone,
              relationship_to_user: relationship.trim(),
            } as BeneficiaryInformation,
          ],
        }));
        setExpandedAssets(prev => ({ ...prev, [inlineTarget.id]: true }));
      } else {
        await BeneficiaryService.linkPolicyToBeneficiary(inlineTarget.id, beneficiaryId, 100, 'equal_split');
        setPolicyBeneficiaries(prev => ({
          ...prev,
          [inlineTarget.id]: [
            ...(prev[inlineTarget.id] || []),
            {
              beneficiary_id: beneficiaryId,
              beneficiary_first_name: firstName.trim(),
              beneficiary_surname: surname.trim(),
              beneficiary_name: `${firstName.trim()} ${surname.trim()}`.trim(),
              beneficiary_email: email.trim(),
              beneficiary_phone: formattedPhone,
              relationship_to_user: relationship.trim(),
            } as BeneficiaryInformation,
          ],
        }));
        setExpandedPolicies(prev => ({ ...prev, [inlineTarget.id]: true }));
      }

      setBeneficiariesCount(prev => prev + 1);
      setToastMessage('Beneficiary linked successfully.');
      setToastType('success');
      setShowToast(true);
      cancelInlineAdd();
    } catch (error) {
      console.error('Error linking beneficiary:', error);
      setToastMessage('Failed to link beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setInlineSaving(false);
    }
  };

  const handleDelinkBeneficiary = (type: 'asset' | 'policy', id: string, beneficiary: BeneficiaryInformation) => {
    const itemName = type === 'asset' 
      ? assets.find(a => a.asset_id === id)?.asset_name || 'this asset'
      : policies.find(p => p.policy_id === id)?.policy_number || 'this policy';
    
    Alert.alert(
      'Delink Beneficiary',
      `Are you sure you want to delink ${beneficiary.beneficiary_name || 'this beneficiary'} from ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delink',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'asset') {
                await BeneficiaryService.delinkAssetFromBeneficiary(id, beneficiary.beneficiary_id);
                setAssetBeneficiaries(prev => ({
                  ...prev,
                  [id]: prev[id].filter(b => b.beneficiary_id !== beneficiary.beneficiary_id),
                }));
              } else {
                await BeneficiaryService.delinkPolicyFromBeneficiary(id, beneficiary.beneficiary_id);
                setPolicyBeneficiaries(prev => ({
                  ...prev,
                  [id]: prev[id].filter(b => b.beneficiary_id !== beneficiary.beneficiary_id),
                }));
              }
              setToastMessage('Beneficiary delinked successfully.');
              setToastType('success');
              setShowToast(true);
            } catch (error) {
              console.error('Error delinking beneficiary:', error);
              setToastMessage('Failed to delink beneficiary.');
              setToastType('error');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAsset = (asset: AssetInformation) => {
    const linkedBeneficiaries = assetBeneficiaries[asset.asset_id] || [];
    const warningMessage = linkedBeneficiaries.length > 0
      ? `This asset has ${linkedBeneficiaries.length} linked beneficiary/beneficiaries. All links will be removed. Are you sure you want to delete ${asset.asset_name}?`
      : `Are you sure you want to delete ${asset.asset_name}?`;

    Alert.alert('Delete Asset', warningMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await BeneficiaryService.delinkAllBeneficiariesFromAsset(asset.asset_id);
            await AssetService.deleteAsset(asset.asset_id);
            setAssets(prev => prev.filter(a => a.asset_id !== asset.asset_id));
            setAssetBeneficiaries(prev => {
              const updated = { ...prev };
              delete updated[asset.asset_id];
              return updated;
            });
            setAssetsCount(prev => prev - 1);
            setToastMessage('Asset deleted successfully.');
            setToastType('success');
            setShowToast(true);
          } catch (error) {
            console.error('Error deleting asset:', error);
            setToastMessage('Failed to delete asset.');
            setToastType('error');
            setShowToast(true);
          }
        },
      },
    ]);
  };

  const handleDeletePolicy = (policy: PolicyInformation) => {
    const linkedBeneficiaries = policyBeneficiaries[policy.policy_id] || [];
    const warningMessage = linkedBeneficiaries.length > 0
      ? `This policy has ${linkedBeneficiaries.length} linked beneficiary/beneficiaries. All links will be removed. Are you sure you want to delete ${policy.policy_number}?`
      : `Are you sure you want to delete ${policy.policy_number}?`;

    Alert.alert('Delete Policy', warningMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await BeneficiaryService.delinkAllBeneficiariesFromPolicy(policy.policy_id);
            await PolicyService.deletePolicy(policy.policy_id);
            setPolicies(prev => prev.filter(p => p.policy_id !== policy.policy_id));
            setPolicyBeneficiaries(prev => {
              const updated = { ...prev };
              delete updated[policy.policy_id];
              return updated;
            });
            setPoliciesCount(prev => prev - 1);
            setToastMessage('Policy deleted successfully.');
            setToastType('success');
            setShowToast(true);
          } catch (error) {
            console.error('Error deleting policy:', error);
            setToastMessage('Failed to delete policy.');
            setToastType('error');
            setShowToast(true);
          }
        },
      },
    ]);
  };

  const renderInlineForm = () => (
    <View style={styles.inlineAddContainer}>
      <TextInput
        style={styles.inlineInput}
        placeholder="First Name"
        placeholderTextColor={theme.colors.placeholder}
        value={inlineForm.firstName}
        onChangeText={value => updateInlineForm('firstName', value)}
      />
      <TextInput
        style={styles.inlineInput}
        placeholder="Surname"
        placeholderTextColor={theme.colors.placeholder}
        value={inlineForm.surname}
        onChangeText={value => updateInlineForm('surname', value)}
      />
      <TextInput
        style={styles.inlineInput}
        placeholder="Relationship"
        placeholderTextColor={theme.colors.placeholder}
        value={inlineForm.relationship}
        onChangeText={value => updateInlineForm('relationship', value)}
      />
      <TextInput
        style={styles.inlineInput}
        placeholder="Email (optional)"
        placeholderTextColor={theme.colors.placeholder}
        value={inlineForm.email}
        onChangeText={value => updateInlineForm('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.inlineInput}
        placeholder="Phone (optional)"
        placeholderTextColor={theme.colors.placeholder}
        value={inlineForm.phone}
        onChangeText={value => updateInlineForm('phone', value)}
        keyboardType="phone-pad"
      />
      <View style={styles.inlineActions}>
        <TouchableOpacity
          style={styles.inlineCancelButton}
          onPress={cancelInlineAdd}
          disabled={inlineSaving}
        >
          <Text style={styles.inlineCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inlineSaveButton}
          onPress={handleInlineSave}
          disabled={inlineSaving}
        >
          <Text style={styles.inlineSaveText}>{inlineSaving ? 'Saving...' : 'Save & Link'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAssetNavIcon = () => (
    <View style={styles.assetNavIcon}>
      <Ionicons name="document-text-outline" size={28} color={theme.colors.primary} />
      <Ionicons
        name="home-outline"
        size={18}
        color={theme.colors.primary}
        style={styles.assetNavHouseIcon}
      />
    </View>
  );

  const renderAssetCard = (asset: AssetInformation) => {
    const linked = assetBeneficiaries[asset.asset_id] || [];
    const isExpanded = expandedAssets[asset.asset_id];
    const inlineVisible = inlineTarget?.type === 'asset' && inlineTarget.id === asset.asset_id;

    return (
      <View key={asset.asset_id} style={styles.managementCard}>
        <TouchableOpacity
          style={styles.managementCardHeader}
          onPress={() => toggleAssetRow(asset.asset_id)}
          activeOpacity={0.8}
        >
          <View style={styles.managementHeaderLeft}>
            <Text style={styles.managementCardTitle}>{asset.asset_name}</Text>
            <Text style={styles.managementCardSubtitle}>{asset.asset_type.replace('_', ' ')}</Text>
          </View>
          <View style={styles.managementHeaderActions}>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => toggleAssetRow(asset.asset_id)}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={isExpanded ? theme.colors.primary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => beginInlineAdd('asset', asset.asset_id)}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => handleDeleteAsset(asset)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
              style={styles.managementChevron}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.managementContent}>
            {linked.length > 0 ? (
              <View style={styles.linkedList}>
                {linked.map(ben => (
                  <View key={ben.beneficiary_id} style={styles.linkedItemRow}>
                    <Text style={styles.linkedItem}>• {ben.beneficiary_name}</Text>
                    <TouchableOpacity onPress={() => handleDelinkBeneficiary('asset', asset.asset_id, ben)}>
                      <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.linkedEmpty}>No beneficiaries linked yet.</Text>
            )}
            <Text style={styles.linkedHint}>Tap + to add more beneficiaries.</Text>
          </View>
        )}

        {inlineVisible && renderInlineForm()}
      </View>
    );
  };

  const renderPolicyCard = (policy: PolicyInformation) => {
    const linked = policyBeneficiaries[policy.policy_id] || [];
    const isExpanded = expandedPolicies[policy.policy_id];
    const inlineVisible = inlineTarget?.type === 'policy' && inlineTarget.id === policy.policy_id;

    return (
      <View key={policy.policy_id} style={styles.managementCard}>
        <TouchableOpacity
          style={styles.managementCardHeader}
          onPress={() => togglePolicyRow(policy.policy_id)}
          activeOpacity={0.8}
        >
          <View style={styles.managementHeaderLeft}>
            <Text style={styles.managementCardTitle}>{policy.policy_number}</Text>
            <Text style={styles.managementCardSubtitle}>
              {policy.insurance_company} · {policy.policy_type.replace('_', ' ')}
            </Text>
          </View>
          <View style={styles.managementHeaderActions}>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => togglePolicyRow(policy.policy_id)}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={isExpanded ? theme.colors.primary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => beginInlineAdd('policy', policy.policy_id)}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => handleDeletePolicy(policy)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
              style={styles.managementChevron}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.managementContent}>
            {linked.length > 0 ? (
              <View style={styles.linkedList}>
                {linked.map(ben => (
                  <View key={ben.beneficiary_id} style={styles.linkedItemRow}>
                    <Text style={styles.linkedItem}>• {ben.beneficiary_name}</Text>
                    <TouchableOpacity onPress={() => handleDelinkBeneficiary('policy', policy.policy_id, ben)}>
                      <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.linkedEmpty}>No beneficiaries linked yet.</Text>
            )}
            <Text style={styles.linkedHint}>Tap + to add more beneficiaries.</Text>
          </View>
        )}

        {inlineVisible && renderInlineForm()}
      </View>
    );
  };

  const renderAssetsManager = () => (
    <View style={styles.managementSection}>
      <Text style={styles.managementToggleTitle}>Assets ({assets.length})</Text>
      <View style={styles.managementList}>
        {assets.length === 0 ? (
          <Text style={styles.managementEmpty}>No assets added yet.</Text>
        ) : (
          assets.map(renderAssetCard)
        )}
      </View>
    </View>
  );

  const renderPoliciesManager = () => (
    <View style={styles.managementSection}>
      <Text style={styles.managementToggleTitle}>Policies ({policies.length})</Text>
      <View style={styles.managementList}>
        {policies.length === 0 ? (
          <Text style={styles.managementEmpty}>No policies added yet.</Text>
        ) : (
          policies.map(renderPolicyCard)
        )}
      </View>
    </View>
  );

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        loadDashboardData();
      }
    });
    return unsubscribe;
  }, [navigation, currentUser]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Logo, Menu, and Logout */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSideMenu(true)}
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabsCard}>
          <View style={styles.navTabs}>
            <TouchableOpacity
              style={[
                styles.navTab,
                selectedManagement === 'assets' && styles.navTabActive,
              ]}
              onPress={() =>
                setSelectedManagement(prev => (prev === 'assets' ? null : 'assets'))
              }
            >
              {renderAssetNavIcon()}
              <Text style={styles.navTabNumber}>{assetsCount}</Text>
            </TouchableOpacity>

            <View style={styles.navTabCenter}>
              {userProfile?.profile_picture_path ? (
                <Image
                  source={{ uri: userProfile.profile_picture_path }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.centerCircle} />
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.navTab,
                showBeneficiariesModal && styles.navTabActive,
              ]}
              onPress={() => setShowBeneficiariesModal(true)}
            >
              <Ionicons name="people" size={28} color={theme.colors.primary} />
              <Text style={styles.navTabNumber}>{beneficiariesCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.assetsPoliciesPill}>
          <TouchableOpacity
            style={[
              styles.assetsPoliciesTab,
              selectedManagement === 'assets' && styles.assetsPoliciesTabActive,
            ]}
            onPress={() =>
              setSelectedManagement(prev => (prev === 'assets' ? null : 'assets'))
            }
          >
            <Text
              style={[
                styles.assetsPoliciesTabText,
                selectedManagement === 'assets' && styles.assetsPoliciesTabTextActive,
              ]}
            >
              Assets
            </Text>
          </TouchableOpacity>

          <Text style={styles.assetsPoliciesDivider}>|</Text>

          <TouchableOpacity
            style={[
              styles.assetsPoliciesTab,
              selectedManagement === 'policies' && styles.assetsPoliciesTabActive,
            ]}
            onPress={() =>
              setSelectedManagement(prev => (prev === 'policies' ? null : 'policies'))
            }
          >
            <Text
              style={[
                styles.assetsPoliciesTabText,
                selectedManagement === 'policies' && styles.assetsPoliciesTabTextActive,
              ]}
            >
              Policies
            </Text>
          </TouchableOpacity>
        </View>

        {selectedManagement === 'assets' && renderAssetsManager()}
        {selectedManagement === 'policies' && renderPoliciesManager()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddAssetPolicy}>
            <Text style={styles.actionButtonText}>Add Your Assets / Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              (assetsCount === 0 && policiesCount === 0) && styles.actionButtonDisabled
            ]} 
            onPress={handleAddBeneficiary}
            activeOpacity={(assetsCount === 0 && policiesCount === 0) ? 0.6 : 0.8}
          >
            <Text style={[
              styles.actionButtonText,
              (assetsCount === 0 && policiesCount === 0) && styles.actionButtonTextDisabled
            ]}>
              Add Beneficiary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUploadWill}>
            <View style={styles.uploadWillButton}>
              <Text style={styles.actionButtonText}>{hasWill ? 'Edit Will' : 'Upload Will'}</Text>
              {!hasWill && (
                <View style={styles.urgentIndicator}>
                  <Text style={styles.urgentText}>!</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUpdateProfile}>
            <Text style={styles.actionButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Verification Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next Check-in</Text>
              <Text style={styles.statusValue}>In 7 days</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Assets Added</Text>
              <Text style={styles.statusValue}>{assetsCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Policies Added</Text>
              <Text style={styles.statusValue}>{policiesCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Beneficiaries</Text>
              <Text style={styles.statusValue}>{beneficiariesCount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showBeneficiariesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBeneficiariesModal(false)}
      >
        <View style={styles.beneficiaryModalOverlay}>
          <View style={styles.beneficiaryModalContent}>
            <View style={styles.beneficiaryModalHeader}>
              <Text style={styles.beneficiaryModalTitle}>Beneficiaries Overview</Text>
              <TouchableOpacity onPress={() => setShowBeneficiariesModal(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.beneficiaryModalScroll}
              contentContainerStyle={styles.beneficiaryModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {beneficiarySummaries.length === 0 ? (
                <Text style={styles.beneficiaryModalEmpty}>
                  No beneficiaries linked yet.
                </Text>
              ) : (
                beneficiarySummaries.map(summary => {
                  const displayName =
                    summary.beneficiary.beneficiary_name ||
                    `${summary.beneficiary.beneficiary_first_name || ''} ${
                      summary.beneficiary.beneficiary_surname || ''
                    }`.trim() ||
                    'Unnamed Beneficiary';

                  return (
                    <View
                      key={summary.beneficiary.beneficiary_id}
                      style={styles.beneficiaryModalCard}
                    >
                      <Text style={styles.beneficiaryModalName}>{displayName}</Text>
                      {summary.beneficiary.relationship_to_user ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Relationship: {summary.beneficiary.relationship_to_user}
                        </Text>
                      ) : null}
                      {summary.beneficiary.beneficiary_email ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Email: {summary.beneficiary.beneficiary_email}
                        </Text>
                      ) : null}
                      {summary.beneficiary.beneficiary_phone ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Phone: {summary.beneficiary.beneficiary_phone}
                        </Text>
                      ) : null}

                      <View style={styles.beneficiaryModalSection}>
                        <Text style={styles.beneficiaryModalSectionTitle}>Assets</Text>
                        {summary.assets.length === 0 ? (
                          <Text style={styles.beneficiaryModalEmptyItem}>
                            Not linked to any assets yet.
                          </Text>
                        ) : (
                          summary.assets.map(asset => (
                            <Text key={asset.asset_id} style={styles.beneficiaryModalItem}>
                              • {asset.asset_name}
                            </Text>
                          ))
                        )}
                      </View>

                      <View style={styles.beneficiaryModalSection}>
                        <Text style={styles.beneficiaryModalSectionTitle}>Policies</Text>
                        {summary.policies.length === 0 ? (
                          <Text style={styles.beneficiaryModalEmptyItem}>
                            Not linked to any policies yet.
                          </Text>
                        ) : (
                          summary.policies.map(policy => (
                            <Text key={policy.policy_id} style={styles.beneficiaryModalItem}>
                              • {policy.policy_number} ({policy.insurance_company})
                            </Text>
                          ))
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <AssetPolicyModal
        visible={showAssetPolicyModal}
        onClose={() => setShowAssetPolicyModal(false)}
        onSelectAsset={handleAddAsset}
        onSelectPolicy={handleAddPolicy}
      />

      <SideMenu
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        navigation={navigation}
      />

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  logo: {
    width: 100,
    height: 60,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium as any,
  },
  navTabsCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 14,
  },
  navTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
  },
  navTabActive: {
    transform: [{ scale: 1.05 }],
  },
  assetNavIcon: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetNavHouseIcon: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 2,
  },
  navTabNumber: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.regular as any,
    marginTop: theme.spacing.xs,
  },
  navTabCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.border,
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  assetsPoliciesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  assetsPoliciesTab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  assetsPoliciesTabActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  assetsPoliciesTabText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    letterSpacing: 0.6,
  },
  assetsPoliciesTabTextActive: {
    color: theme.colors.primary,
  },
  assetsPoliciesDivider: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.sm,
  },
  managementSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  managementToggleTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginBottom: theme.spacing.sm,
  },
  managementList: {
    marginBottom: theme.spacing.lg,
  },
  managementEmpty: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.sm,
  },
  managementCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  managementCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  managementHeaderLeft: {
    flex: 1,
  },
  managementCardTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginBottom: 2,
  },
  managementCardSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  managementHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managementIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.primary + '12',
  },
  managementChevron: {
    marginLeft: theme.spacing.xs,
  },
  managementContent: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  linkedList: {
    marginBottom: theme.spacing.sm,
  },
  linkedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  linkedItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
  },
  linkedEmpty: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  linkedHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    fontStyle: 'italic',
  },
  inlineAddContainer: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  inlineInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  inlineCancelButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.border,
  },
  inlineSaveButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    marginLeft: theme.spacing.sm,
  },
  inlineCancelText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
  },
  inlineSaveText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  userInfo: {
    paddingHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.regular as any,
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.regular as any,
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  actionButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  uploadWillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  urgentIndicator: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.bold as any,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  statusBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.semibold as any,
  },
  beneficiaryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  beneficiaryModalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
  },
  beneficiaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  beneficiaryModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  beneficiaryModalScroll: {
    maxHeight: 420,
  },
  beneficiaryModalScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  beneficiaryModalEmpty: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  beneficiaryModalCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  beneficiaryModalName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  beneficiaryModalMeta: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 1.5,
  },
  beneficiaryModalSection: {
    marginTop: theme.spacing.md,
  },
  beneficiaryModalSectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  beneficiaryModalItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 1.2,
  },
  beneficiaryModalEmptyItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default DashboardScreen;
