import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
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
import NotificationService from '../services/notificationService';
import { UserProfile } from '../types/user';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import { NotificationInformation } from '../types/notification';
import { formatSAPhoneNumber, isValidSAPhoneNumber } from '../utils/phoneFormatter';
import { dashboardStyles as styles } from './DashboardScreen.styles';

const relationshipOptions = [
  { label: 'Spouse', value: 'spouse' },
  { label: 'Partner', value: 'partner' },
  { label: 'Fiancé / Fiancée', value: 'fiance' },
  { label: 'Child', value: 'child' },
  { label: 'Parent', value: 'parent' },
  { label: 'Stepparent', value: 'stepparent' },
  { label: 'Stepchild', value: 'stepchild' },
  { label: 'Sibling', value: 'sibling' },
  { label: 'Half-Sibling', value: 'half_sibling' },
  { label: 'Grandparent', value: 'grandparent' },
  { label: 'Grandchild', value: 'grandchild' },
  { label: 'Aunt', value: 'aunt' },
  { label: 'Uncle', value: 'uncle' },
  { label: 'Niece', value: 'niece' },
  { label: 'Nephew', value: 'nephew' },
  { label: 'Cousin', value: 'cousin' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Ward', value: 'ward' },
  { label: 'Friend', value: 'friend' },
  { label: 'Neighbour', value: 'neighbour' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Mentee', value: 'mentee' },
  { label: 'Colleague', value: 'colleague' },
  { label: 'Business Partner', value: 'business_partner' },
  { label: 'Employer', value: 'employer' },
  { label: 'Employee', value: 'employee' },
  { label: 'Caregiver', value: 'caregiver' },
  { label: 'Pastor / Spiritual Leader', value: 'pastor' },
  { label: 'Financial Advisor', value: 'financial_advisor' },
  { label: 'Legal Advisor', value: 'legal_advisor' },
  { label: 'Doctor', value: 'doctor' },
  { label: 'Therapist', value: 'therapist' },
  { label: 'Coach', value: 'coach' },
  { label: 'Other', value: 'other' },
];

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
  const [assetBeneficiaryPercentages, setAssetBeneficiaryPercentages] =
    useState<Record<string, Record<string, number>>>({});
  const [policyBeneficiaryPercentages, setPolicyBeneficiaryPercentages] =
    useState<Record<string, Record<string, number>>>({});
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const [selectedManagement, setSelectedManagement] = useState<'assets' | null>(null);
  const [showBeneficiariesModal, setShowBeneficiariesModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'new' | 'older'>('new');
  const [hasAttorneyNotification, setHasAttorneyNotification] = useState(false);
  const [hasExecutorNotification, setHasExecutorNotification] = useState(false);
  const [newNotifications, setNewNotifications] = useState<NotificationInformation[]>([]);
  const [olderNotifications, setOlderNotifications] = useState<NotificationInformation[]>([]);
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
  const [inlineRelationshipDropdownVisible, setInlineRelationshipDropdownVisible] = useState(false);
  const [inlineRelationshipOption, setInlineRelationshipOption] = useState<string>('');
  const inlineRelationshipInputRef = useRef<TextInput | null>(null);
  const [showBeneficiarySelectionModal, setShowBeneficiarySelectionModal] = useState(false);
  const [beneficiarySelectionTarget, setBeneficiarySelectionTarget] =
    useState<{ type: 'asset' | 'policy'; id: string } | null>(null);
  const [allBeneficiaries, setAllBeneficiaries] = useState<BeneficiaryInformation[]>([]);
  const [showLinkAssetPolicyModal, setShowLinkAssetPolicyModal] = useState(false);
  const [selectedBeneficiaryForLinking, setSelectedBeneficiaryForLinking] = useState<BeneficiaryInformation | null>(null);
  const [estateValue, setEstateValue] = useState(0);

  const formatCurrencyValue = (value: number) =>
    `R ${value.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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

  const getNextCheckInLabel = () => {
    if (!userProfile) return 'Not scheduled';
    const frequency = userProfile.notification_frequency;
    const customDays = (userProfile as any).custom_frequency_days;

    if (frequency === 'custom_days') {
      if (customDays) {
        return `Every ${customDays} day${customDays === 1 ? '' : 's'}`;
      }
      return 'Custom schedule';
    }

    const baseMap: Record<string, string> = {
      daily: 'Every day',
      weekly: 'Every 7 days',
      monthly: 'Every 30 days',
      quarterly: 'Every 90 days',
      yearly: 'Every 365 days',
    };

    return baseMap[frequency as keyof typeof baseMap] || 'Not scheduled';
  };

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const profile = await UserService.getUserById(currentUser.uid);
      setUserProfile(profile);

      // Load notifications from the new notification system
      try {
        const newNotifs = await NotificationService.getNewNotifications(currentUser.uid);
        setNewNotifications(newNotifs);

        const olderNotifs = await NotificationService.getOlderNotifications(currentUser.uid);
        setOlderNotifications(olderNotifs);

        // Check if there are attorney/executor notifications in the new system
        const hasAttorney = newNotifs.some(n => n.notification_type === 'attorney_assignment' && !n.is_dismissed);
        const hasExecutor = newNotifs.some(n => n.notification_type === 'executor_assignment' && !n.is_dismissed);
        
        setHasAttorneyNotification(hasAttorney);
        setHasExecutorNotification(hasExecutor);
      } catch (notifError) {
        console.error('Error loading notifications:', notifError);
        
        // Fallback to old system if new notification system fails
        if (profile) {
          const hasOwnAttorney = profile.has_own_attorney ?? false;
          const hasOwnExecutor = profile.has_own_executor ?? false;
          const miWillAttorneyAccepted = profile.miwill_attorney_accepted ?? false;
          const miWillExecutorAccepted = profile.miwill_executor_accepted ?? false;
          const attorneyDismissed = profile.attorney_notification_dismissed ?? false;
          const executorDismissed = profile.executor_notification_dismissed ?? false;

          const needsAttorneyNotification =
            !hasOwnAttorney && miWillAttorneyAccepted && !attorneyDismissed;

          const needsExecutorNotification =
            !hasOwnExecutor && miWillExecutorAccepted && !executorDismissed;

          setHasAttorneyNotification(needsAttorneyNotification);
          setHasExecutorNotification(needsExecutorNotification);
        }
      }

      // Fetch assets
      const userAssets = await AssetService.getUserAssets(currentUser.uid);
      setAssets(userAssets);
      setAssetsCount(userAssets.length);
      const assetsTotal = userAssets.reduce((sum, asset) => sum + (asset.asset_value || 0), 0);

      // Fetch policies
      const userPolicies = await PolicyService.getUserPolicies(currentUser.uid);
      setPolicies(userPolicies);
      setPoliciesCount(userPolicies.length);
      const policiesTotal = userPolicies.reduce((sum, policy) => sum + (policy.policy_value || 0), 0);
      setEstateValue(assetsTotal + policiesTotal);

      // Fetch beneficiaries count
      const beneficiaries = await BeneficiaryService.getUserBeneficiaries(currentUser.uid);
      setBeneficiariesCount(beneficiaries.length);
      setAllBeneficiaries(beneficiaries);

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
      
      // Fetch allocation percentages for assets
      const assetPercentagesMap: Record<string, Record<string, number>> = {};
      for (const asset of userAssets) {
        const percentages = await BeneficiaryService.getAssetBeneficiaryLinks(asset.asset_id);
        assetPercentagesMap[asset.asset_id] = percentages;
      }
      setAssetBeneficiaryPercentages(assetPercentagesMap);
      
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
      
      // Fetch allocation percentages for policies
      const policyPercentagesMap: Record<string, Record<string, number>> = {};
      for (const policy of userPolicies) {
        const percentages = await BeneficiaryService.getPolicyBeneficiaryLinks(policy.policy_id);
        policyPercentagesMap[policy.policy_id] = percentages;
      }
      setPolicyBeneficiaryPercentages(policyPercentagesMap);
      
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
    navigation.navigate('AddAsset');
  };

  const handleAddAsset = () => {
    navigation.navigate('AddAsset');
  };

  const handleAddPolicy = () => {
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

  const handleCODCalculator = () => {
    navigation.navigate('CODCalculator');
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
    // Show selection modal to choose between new or existing beneficiary
    setBeneficiarySelectionTarget({ type, id });
    setShowBeneficiarySelectionModal(true);
  };

  const handleCreateNewBeneficiary = () => {
    if (!beneficiarySelectionTarget) return;
    setShowBeneficiarySelectionModal(false);
    setInlineTarget(beneficiarySelectionTarget);
    setInlineForm({
      firstName: '',
      surname: '',
      relationship: '',
      email: '',
      phone: '',
    });
    setInlineRelationshipOption('');
    setInlineRelationshipDropdownVisible(false);
  };

  const handleSelectExistingBeneficiary = async (beneficiary: BeneficiaryInformation) => {
    if (!beneficiarySelectionTarget || !currentUser) return;

    setShowBeneficiarySelectionModal(false);

    try {
      // Check if already linked
      const existing = beneficiarySelectionTarget.type === 'asset'
        ? assetBeneficiaries[beneficiarySelectionTarget.id] || []
        : policyBeneficiaries[beneficiarySelectionTarget.id] || [];

      if (existing.some(b => b.beneficiary_id === beneficiary.beneficiary_id)) {
        setToastMessage('This beneficiary is already linked to this ' + beneficiarySelectionTarget.type);
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Calculate allocation percentage based on existing beneficiaries
      const existingCount = existing.length;
      const newCount = existingCount + 1;
      const allocationPercentage = newCount === 1 ? 100 : 100 / newCount;
      const roundedAllocation = Math.round(allocationPercentage * 100) / 100;

      // Link the beneficiary
      if (beneficiarySelectionTarget.type === 'asset') {
        await BeneficiaryService.linkAssetToBeneficiary(
          beneficiarySelectionTarget.id,
          beneficiary.beneficiary_id,
          roundedAllocation,
          'equal_split'
        );
        setAssetBeneficiaries(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: [
            ...(prev[beneficiarySelectionTarget.id] || []),
            beneficiary,
          ],
        }));
        // Update percentages
        const percentages = await BeneficiaryService.getAssetBeneficiaryLinks(beneficiarySelectionTarget.id);
        setAssetBeneficiaryPercentages(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: percentages,
        }));
        setExpandedAssets(prev => ({ ...prev, [beneficiarySelectionTarget.id]: true }));
      } else {
        await BeneficiaryService.linkPolicyToBeneficiary(
          beneficiarySelectionTarget.id,
          beneficiary.beneficiary_id,
          roundedAllocation,
          'equal_split'
        );
        setPolicyBeneficiaries(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: [
            ...(prev[beneficiarySelectionTarget.id] || []),
            beneficiary,
          ],
        }));
        // Update percentages
        const percentages = await BeneficiaryService.getPolicyBeneficiaryLinks(beneficiarySelectionTarget.id);
        setPolicyBeneficiaryPercentages(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: percentages,
        }));
        setExpandedPolicies(prev => ({ ...prev, [beneficiarySelectionTarget.id]: true }));
      }

      setToastMessage('Beneficiary linked successfully.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error linking beneficiary:', error);
      setToastMessage('Failed to link beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
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
    setInlineRelationshipOption('');
    setInlineRelationshipDropdownVisible(false);
  };

  const handleSelectInlineRelationship = (optionValue: string, label: string) => {
    setInlineRelationshipOption(optionValue);
    if (optionValue === 'other') {
      updateInlineForm('relationship', '');
      setTimeout(() => {
        inlineRelationshipInputRef.current?.focus();
      }, 150);
    } else {
      updateInlineForm('relationship', label);
    }
    setInlineRelationshipDropdownVisible(false);
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

  const handleDelinkBeneficiaryFromItem = (type: 'asset' | 'policy', itemId: string, beneficiary: BeneficiaryInformation) => {
    const itemName = type === 'asset'
      ? assets.find(a => a.asset_id === itemId)?.asset_name || 'this asset'
      : policies.find(p => p.policy_id === itemId)?.policy_number || 'this policy';
    
    const beneficiaryName = beneficiary.beneficiary_name || 
      `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_surname || ''}`.trim() ||
      'this beneficiary';

    Alert.alert(
      'Delink Beneficiary',
      `Are you sure you want to delink ${beneficiaryName} from ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delink',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'asset') {
                await BeneficiaryService.delinkAssetFromBeneficiary(itemId, beneficiary.beneficiary_id);
              } else {
                await BeneficiaryService.delinkPolicyFromBeneficiary(itemId, beneficiary.beneficiary_id);
              }
              setToastMessage('Beneficiary delinked successfully.');
              setToastType('success');
              setShowToast(true);
              // Refresh dashboard data
              loadDashboardData();
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

  const handleDeleteBeneficiary = (beneficiary: BeneficiaryInformation) => {
    const beneficiaryName = beneficiary.beneficiary_name || 
      `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_surname || ''}`.trim() ||
      'this beneficiary';

    const totalLinks = (beneficiarySummaries.find(s => s.beneficiary.beneficiary_id === beneficiary.beneficiary_id)?.assets.length || 0) +
      (beneficiarySummaries.find(s => s.beneficiary.beneficiary_id === beneficiary.beneficiary_id)?.policies.length || 0);

    const warningMessage = totalLinks > 0
      ? `This beneficiary is linked to ${totalLinks} asset(s)/policy(ies). All links will be removed. Are you sure you want to delete ${beneficiaryName}?`
      : `Are you sure you want to delete ${beneficiaryName}?`;

    Alert.alert('Delete Beneficiary', warningMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // First delink all assets and policies
            await BeneficiaryService.delinkAllFromBeneficiary(beneficiary.beneficiary_id);
            // Then delete the beneficiary
            await BeneficiaryService.deleteBeneficiary(beneficiary.beneficiary_id);
            setToastMessage('Beneficiary deleted successfully.');
            setToastType('success');
            setShowToast(true);
            // Refresh dashboard data
            loadDashboardData();
          } catch (error) {
            console.error('Error deleting beneficiary:', error);
            setToastMessage('Failed to delete beneficiary.');
            setToastType('error');
            setShowToast(true);
          }
        },
      },
    ]);
  };

  const handleOpenLinkModal = (beneficiary: BeneficiaryInformation) => {
    setSelectedBeneficiaryForLinking(beneficiary);
    // Close the overview modal before opening the link modal to avoid stacked-modals issues
    setShowBeneficiariesModal(false);
    requestAnimationFrame(() => {
      setShowLinkAssetPolicyModal(true);
    });
  };

  const handleLinkToAssetOrPolicy = async (type: 'asset' | 'policy', id: string) => {
    if (!selectedBeneficiaryForLinking || !currentUser) return;

    setShowLinkAssetPolicyModal(false);

    try {
      // Check if already linked
      const existing = type === 'asset'
        ? assetBeneficiaries[id] || []
        : policyBeneficiaries[id] || [];

      if (existing.some(b => b.beneficiary_id === selectedBeneficiaryForLinking.beneficiary_id)) {
        setToastMessage('This beneficiary is already linked to this ' + type);
        setToastType('error');
        setShowToast(true);
        return;
      }

      // Link the beneficiary
      if (type === 'asset') {
        await BeneficiaryService.linkAssetToBeneficiary(
          id,
          selectedBeneficiaryForLinking.beneficiary_id,
          100,
          'equal_split'
        );
        setAssetBeneficiaries(prev => ({
          ...prev,
          [id]: [
            ...(prev[id] || []),
            selectedBeneficiaryForLinking,
          ],
        }));
        setExpandedAssets(prev => ({ ...prev, [id]: true }));
      } else {
        await BeneficiaryService.linkPolicyToBeneficiary(
          id,
          selectedBeneficiaryForLinking.beneficiary_id,
          100,
          'equal_split'
        );
        setPolicyBeneficiaries(prev => ({
          ...prev,
          [id]: [
            ...(prev[id] || []),
            selectedBeneficiaryForLinking,
          ],
        }));
        setExpandedPolicies(prev => ({ ...prev, [id]: true }));
      }

      setToastMessage('Beneficiary linked successfully.');
      setToastType('success');
      setShowToast(true);
      setSelectedBeneficiaryForLinking(null);
      
      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error linking beneficiary:', error);
      setToastMessage('Failed to link beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
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
      <View
        style={[
          styles.dropdownWrapper,
          inlineRelationshipDropdownVisible && styles.dropdownWrapperExpanded,
        ]}
      >
        <TouchableOpacity
          style={[styles.inlineInput, styles.dropdownInput]}
          onPress={() => setInlineRelationshipDropdownVisible(prev => !prev)}
        >
          <Text
            style={
              inlineForm.relationship || inlineRelationshipOption
                ? styles.dropdownSelectedText
                : styles.dropdownPlaceholder
            }
          >
            {inlineRelationshipOption === 'other' && inlineForm.relationship
              ? inlineForm.relationship
              : inlineRelationshipOption
              ? relationshipOptions.find(opt => opt.value === inlineRelationshipOption)?.label || 'Select relationship'
              : inlineForm.relationship || 'Select relationship'}
          </Text>
          <Ionicons
            name={inlineRelationshipDropdownVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        {inlineRelationshipDropdownVisible && (
          <View style={styles.dropdownList}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={styles.dropdownListContent}
            >
              {relationshipOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownOption}
                  onPress={() => handleSelectInlineRelationship(option.value, option.label)}
                >
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {inlineRelationshipOption === 'other' && (
        <TextInput
          ref={inlineRelationshipInputRef}
          style={styles.inlineInput}
          placeholder="State Other relationship"
          placeholderTextColor={theme.colors.placeholder}
          value={inlineForm.relationship}
          onChangeText={value => updateInlineForm('relationship', value)}
        />
      )}
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
                name={isExpanded ? "eye" : "eye-off-outline"}
                size={24}
                color={isExpanded ? theme.colors.primary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => beginInlineAdd('asset', asset.asset_id)}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => handleDeleteAsset(asset)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
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
                {linked.map(ben => {
                  const percentage = assetBeneficiaryPercentages[asset.asset_id]?.[ben.beneficiary_id] || 0;
                  return (
                    <View key={ben.beneficiary_id} style={styles.linkedItemRow}>
                      <View style={styles.linkedItemContainer}>
                        <Text style={styles.linkedItem}>• {ben.beneficiary_name}</Text>
                        {percentage > 0 && (
                          <Text style={styles.linkedItemPercentage}>{percentage}%</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => handleDelinkBeneficiary('asset', asset.asset_id, ben)}>
                        <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.linkedEmpty}>No beneficiaries linked yet.</Text>
            )}
            <TouchableOpacity onPress={() => beginInlineAdd('asset', asset.asset_id)}>
              <Text style={styles.linkedHint}>Tap + to add more beneficiaries.</Text>
            </TouchableOpacity>
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
          <Text style={styles.managementCardTitle}>
            {policy.policy_type.replace('_', ' ')}
          </Text>
          <Text style={styles.managementCardSubtitle}>
            {policy.insurance_company} · {policy.policy_number}
          </Text>
        </View>
          <View style={styles.managementHeaderActions}>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => togglePolicyRow(policy.policy_id)}
            >
              <Ionicons
                name={isExpanded ? "eye" : "eye-off-outline"}
                size={24}
                color={isExpanded ? theme.colors.primary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => beginInlineAdd('policy', policy.policy_id)}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.managementIconButton}
              onPress={() => handleDeletePolicy(policy)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
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
                {linked.map(ben => {
                  const percentage = policyBeneficiaryPercentages[policy.policy_id]?.[ben.beneficiary_id] || 0;
                  return (
                    <View key={ben.beneficiary_id} style={styles.linkedItemRow}>
                      <View style={styles.linkedItemContainer}>
                        <Text style={styles.linkedItem}>• {ben.beneficiary_name}</Text>
                        {percentage > 0 && (
                          <Text style={styles.linkedItemPercentage}>{percentage}%</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => handleDelinkBeneficiary('policy', policy.policy_id, ben)}>
                        <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.linkedEmpty}>No beneficiaries linked yet.</Text>
            )}
            <TouchableOpacity onPress={() => beginInlineAdd('policy', policy.policy_id)}>
              <Text style={styles.linkedHint}>Tap + to add more beneficiaries.</Text>
            </TouchableOpacity>
          </View>
        )}

        {inlineVisible && renderInlineForm()}
      </View>
    );
  };

  const renderAssetsManager = () => {
    const allItems = [
      ...assets.map(asset => ({ ...asset, type: 'asset' as const })),
      ...policies.map(policy => ({ ...policy, type: 'policy' as const })),
    ].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return (
      <View style={styles.managementSection}>
        <Text style={styles.managementToggleTitle}>Assets ({allItems.length})</Text>
        <View style={styles.managementList}>
          {allItems.length === 0 ? (
            <TouchableOpacity 
              style={styles.managementEmptyButton}
              onPress={() => navigation.navigate('AddAsset')}
              activeOpacity={0.7}
            >
              <Text style={styles.managementEmptyText}>No assets or policies added yet</Text>
            </TouchableOpacity>
          ) : (
            allItems.map((item) => 
              item.type === 'asset' 
                ? renderAssetCard(item as AssetInformation)
                : renderPolicyCard(item as PolicyInformation)
            )
          )}
        </View>
      </View>
    );
  };

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
        {/* Header with Logo, Notification Bell, and Menu */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => {
                setNotificationTab('new');
                setShowNotificationModal(true);
              }} 
              style={styles.notificationBellButton}
            >
              <Ionicons name="notifications" size={30} color={theme.colors.primary} />
              {(hasAttorneyNotification || hasExecutorNotification) && (
                <View style={styles.notificationBadge} />
              )}
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
        </View>

        {selectedManagement === 'assets' && renderAssetsManager()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddAssetPolicy}>
            <Text style={styles.actionButtonText}>Add Asset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUploadWill}>
            <View style={styles.uploadWillButton}>
              <Text style={styles.actionButtonText}>{hasWill ? 'Edit Will' : 'Draft will'}</Text>
              {!hasWill && (
                <View style={styles.urgentIndicator}>
                  <Text style={styles.urgentText}>!</Text>
                </View>
              )}
            </View>
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

          <TouchableOpacity style={styles.actionButton} onPress={handleCODCalculator}>
            <Ionicons name="calculator" size={20} color={theme.colors.buttonText} style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>COD Calculator</Text>
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
              <Text style={styles.statusValue}>{getNextCheckInLabel()}</Text>
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
              <Text style={styles.statusLabel}>Estate Value</Text>
              <Text style={styles.statusValue}>{formatCurrencyValue(estateValue)}</Text>
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
              {allBeneficiaries.length === 0 ? (
                <View style={styles.beneficiaryModalEmptyState}>
                  <Ionicons name="people-outline" size={60} color={theme.colors.textSecondary} />
                  <Text style={styles.beneficiaryModalEmpty}>
                    No beneficiaries created yet.
                  </Text>
                  <Text style={styles.beneficiaryModalEmptySubtext}>
                    Add beneficiaries to start managing your estate
                  </Text>
                </View>
              ) : (
                allBeneficiaries.map(beneficiary => {
                  const summary = beneficiarySummaries.find(s => s.beneficiary.beneficiary_id === beneficiary.beneficiary_id);
                  const linkedAssets = summary?.assets || [];
                  const linkedPolicies = summary?.policies || [];
                  const totalLinks = linkedAssets.length + linkedPolicies.length;

                  const displayName =
                    beneficiary.beneficiary_name ||
                    `${beneficiary.beneficiary_first_name || ''} ${
                      beneficiary.beneficiary_surname || ''
                    }`.trim() ||
                    'Unnamed Beneficiary';

                  return (
                    <View
                      key={beneficiary.beneficiary_id}
                      style={styles.beneficiaryModalCard}
                    >
                      <View style={styles.beneficiaryModalCardHeader}>
                        <View style={styles.beneficiaryModalCardHeaderLeft}>
                          <Text style={styles.beneficiaryModalName}>{displayName}</Text>
                          {totalLinks > 0 && (
                            <View style={styles.beneficiaryModalLinkBadge}>
                              <Text style={styles.beneficiaryModalLinkBadgeText}>
                                {totalLinks} link{totalLinks !== 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {beneficiary.relationship_to_user ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Relationship: {beneficiary.relationship_to_user}
                        </Text>
                      ) : null}
                      {beneficiary.beneficiary_email ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Email: {beneficiary.beneficiary_email}
                        </Text>
                      ) : null}
                      {beneficiary.beneficiary_phone ? (
                        <Text style={styles.beneficiaryModalMeta}>
                          Phone: {beneficiary.beneficiary_phone}
                        </Text>
                      ) : null}

                      <View style={styles.beneficiaryModalSection}>
                        <Text style={styles.beneficiaryModalSectionTitle}>Assets</Text>
                        {linkedAssets.length === 0 ? (
                          <Text style={styles.beneficiaryModalEmptyItem}>
                            Not linked to any assets yet.
                          </Text>
                        ) : (
                          linkedAssets.map(asset => (
                            <View key={asset.asset_id} style={styles.beneficiaryModalItemRow}>
                              <Text style={styles.beneficiaryModalItem}>• {asset.asset_name}</Text>
                              <TouchableOpacity
                                onPress={() => handleDelinkBeneficiaryFromItem('asset', asset.asset_id, beneficiary)}
                                style={styles.beneficiaryModalDelinkButton}
                              >
                                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>

                      <View style={styles.beneficiaryModalSection}>
                        <Text style={styles.beneficiaryModalSectionTitle}>Policies</Text>
                        {linkedPolicies.length === 0 ? (
                          <Text style={styles.beneficiaryModalEmptyItem}>
                            Not linked to any policies yet.
                          </Text>
                        ) : (
                          linkedPolicies.map(policy => (
                            <View key={policy.policy_id} style={styles.beneficiaryModalItemRow}>
                              <Text style={styles.beneficiaryModalItem}>• {policy.policy_number} ({policy.insurance_company})</Text>
                              <TouchableOpacity
                                onPress={() => handleDelinkBeneficiaryFromItem('policy', policy.policy_id, beneficiary)}
                                style={styles.beneficiaryModalDelinkButton}
                              >
                                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>

                      <View style={styles.beneficiaryModalActions}>
                        <TouchableOpacity
                          style={styles.beneficiaryModalLinkButton}
                          onPress={() => handleOpenLinkModal(beneficiary)}
                        >
                          <Ionicons name="link-outline" size={18} color={theme.colors.primary} />
                          <Text style={styles.beneficiaryModalLinkButtonText}>Link to Asset/Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.beneficiaryModalDeleteButton}
                          onPress={() => handleDeleteBeneficiary(beneficiary)}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                          <Text style={styles.beneficiaryModalDeleteButtonText}>Delete</Text>
                        </TouchableOpacity>
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

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.notificationModalOverlay}>
          <View style={styles.notificationModalContent}>
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.notificationTabs}>
              <TouchableOpacity
                style={[
                  styles.notificationTab,
                  notificationTab === 'new' && styles.notificationTabActive,
                ]}
                onPress={() => setNotificationTab('new')}
              >
                <Text
                  style={[
                    styles.notificationTabText,
                    notificationTab === 'new' && styles.notificationTabTextActive,
                  ]}
                >
                  New {newNotifications.length > 0 && `(${newNotifications.length})`}
                </Text>
                {notificationTab === 'new' && <View style={styles.notificationTabIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.notificationTab,
                  notificationTab === 'older' && styles.notificationTabActive,
                ]}
                onPress={() => setNotificationTab('older')}
              >
                <Text
                  style={[
                    styles.notificationTabText,
                    notificationTab === 'older' && styles.notificationTabTextActive,
                  ]}
                >
                  History {olderNotifications.length > 0 && `(${olderNotifications.length})`}
                </Text>
                {notificationTab === 'older' && <View style={styles.notificationTabIndicator} />}
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.notificationModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {notificationTab === 'new' ? (
                // New Notifications Tab
                newNotifications.length === 0 ? (
                  <View style={styles.notificationEmptyState}>
                    <Ionicons name="notifications-outline" size={60} color={theme.colors.textSecondary} />
                    <Text style={styles.notificationEmptyText}>No new notifications</Text>
                    <Text style={styles.notificationEmptySubtext}>You're all caught up!</Text>
                  </View>
                ) : (
                  newNotifications.map((notification) => (
                    <View key={notification.notification_id} style={styles.notificationCard}>
                      <View style={styles.notificationIconContainer}>
                        <Ionicons 
                          name={notification.priority === 'urgent' ? 'alert-circle' : 'information-circle'} 
                          size={24} 
                          color={notification.priority === 'urgent' ? theme.colors.error : theme.colors.primary} 
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.notification_title}</Text>
                        <Text style={styles.notificationBody}>{notification.notification_message}</Text>
                        <View style={styles.notificationActions}>
                          {notification.is_actionable && notification.notification_action && (
                            <TouchableOpacity
                              style={styles.notificationButton}
                              onPress={async () => {
                                await NotificationService.markAsRead(notification.notification_id);
                                setShowNotificationModal(false);
                                
                                if (notification.notification_action_data?.screen) {
                                  navigation.navigate(notification.notification_action_data.screen, 
                                    notification.notification_action_data.params || {});
                                }
                                
                                // Reload notifications
                                await loadDashboardData();
                              }}
                            >
                              <Text style={styles.notificationButtonText}>
                                {notification.notification_type === 'attorney_assignment' 
                                  ? 'Appoint My Own Attorney'
                                  : notification.notification_type === 'executor_assignment'
                                  ? 'Appoint My Own Executor'
                                  : 'View'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.notificationDismissButton}
                            onPress={async () => {
                              try {
                                await NotificationService.markAsDismissed(notification.notification_id);
                                await loadDashboardData();
                              } catch (error) {
                                console.error('Error dismissing notification:', error);
                              }
                            }}
                          >
                            <Text style={styles.notificationDismissText}>Dismiss</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )
              ) : (
                // History Tab (Older Notifications)
                olderNotifications.length === 0 ? (
                  <View style={styles.notificationEmptyState}>
                    <Ionicons name="time-outline" size={60} color={theme.colors.textSecondary} />
                    <Text style={styles.notificationEmptyText}>No history yet</Text>
                    <Text style={styles.notificationEmptySubtext}>Past notifications will appear here</Text>
                  </View>
                ) : (
                  olderNotifications.map((notification) => (
                    <View key={notification.notification_id} style={styles.notificationCardHistory}>
                      <View style={styles.notificationHistoryLeft}>
                        <View style={styles.notificationHistoryIconContainer}>
                          <Ionicons 
                            name={notification.is_read ? 'checkmark-circle' : 'time-outline'} 
                            size={20} 
                            color={theme.colors.textSecondary} 
                          />
                        </View>
                        <View style={styles.notificationHistoryDivider} />
                      </View>
                      <View style={styles.notificationHistoryContent}>
                        <Text style={styles.notificationHistoryTitle}>
                          {notification.notification_title}
                        </Text>
                        <Text style={styles.notificationHistoryBody}>
                          {notification.notification_message}
                        </Text>
                        <View style={styles.notificationHistoryActions}>
                          {notification.is_actionable && notification.notification_action && (
                            <TouchableOpacity
                              style={styles.notificationHistoryButton}
                              onPress={async () => {
                                await NotificationService.markAsRead(notification.notification_id);
                                setShowNotificationModal(false);
                                
                                if (notification.notification_action_data?.screen) {
                                  navigation.navigate(notification.notification_action_data.screen, 
                                    notification.notification_action_data.params || {});
                                }
                                
                                await loadDashboardData();
                              }}
                            >
                              <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                              <Text style={styles.notificationHistoryButtonText}>
                                {notification.notification_type === 'attorney_assignment' 
                                  ? notification.notification_title.includes('Successfully') ? 'Update Attorney' : 'Appoint Attorney'
                                  : notification.notification_type === 'executor_assignment'
                                  ? notification.notification_title.includes('Successfully') ? 'Update Executor' : 'Appoint Executor'
                                  : 'View'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {!notification.is_dismissed && (
                            <TouchableOpacity
                              style={styles.notificationHistoryDismiss}
                              onPress={async () => {
                                try {
                                  await NotificationService.markAsDismissed(notification.notification_id);
                                  await loadDashboardData();
                                } catch (error) {
                                  console.error('Error dismissing notification:', error);
                                }
                              }}
                            >
                              <Ionicons name="close-circle-outline" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SideMenu
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        navigation={navigation}
        onLogout={handleLogout}
      />

      {/* Link Asset/Policy Modal */}
      <Modal
        visible={showLinkAssetPolicyModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowLinkAssetPolicyModal(false);
          setSelectedBeneficiaryForLinking(null);
        }}
      >
        <View style={styles.linkModalOverlay}>
          <View style={styles.linkModalContent}>
            <View style={styles.linkModalHeader}>
              <Text style={styles.linkModalTitle}>Link to Asset or Policy</Text>
              <TouchableOpacity onPress={() => {
                setShowLinkAssetPolicyModal(false);
                setSelectedBeneficiaryForLinking(null);
              }}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBeneficiaryForLinking && (
              <View style={styles.linkModalBeneficiaryInfo}>
                <Ionicons name="person-circle" size={32} color={theme.colors.primary} />
                <View style={styles.linkModalBeneficiaryInfoText}>
                  <Text style={styles.linkModalBeneficiaryName}>
                    {selectedBeneficiaryForLinking.beneficiary_name ||
                      `${selectedBeneficiaryForLinking.beneficiary_first_name || ''} ${selectedBeneficiaryForLinking.beneficiary_surname || ''}`.trim() ||
                      'Unnamed Beneficiary'}
                  </Text>
                  {selectedBeneficiaryForLinking.relationship_to_user && (
                    <Text style={styles.linkModalBeneficiaryRelationship}>
                      {selectedBeneficiaryForLinking.relationship_to_user}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <ScrollView 
              style={styles.linkModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Assets Section */}
              {assets.length > 0 && (
                <>
                  <Text style={styles.linkModalSectionTitle}>Assets ({assets.length})</Text>
                  {assets.map(asset => {
                    const isLinked = (assetBeneficiaries[asset.asset_id] || []).some(
                      b => b.beneficiary_id === selectedBeneficiaryForLinking?.beneficiary_id
                    );

                    return (
                      <TouchableOpacity
                        key={asset.asset_id}
                        style={[
                          styles.linkModalItem,
                          isLinked && styles.linkModalItemDisabled,
                        ]}
                        onPress={() => !isLinked && handleLinkToAssetOrPolicy('asset', asset.asset_id)}
                        disabled={isLinked}
                      >
                        <View style={styles.linkModalItemIcon}>
                          <Ionicons
                            name={isLinked ? "checkmark-circle" : "home-outline"}
                            size={28}
                            color={isLinked ? theme.colors.success : theme.colors.primary}
                          />
                        </View>
                        <View style={styles.linkModalItemText}>
                          <Text style={[
                            styles.linkModalItemName,
                            isLinked && styles.linkModalItemNameDisabled,
                          ]}>
                            {asset.asset_name}
                          </Text>
                          <Text style={styles.linkModalItemSubtext}>
                            {asset.asset_type.replace('_', ' ')}
                          </Text>
                          {isLinked && (
                            <Text style={styles.linkModalItemLinkedText}>Already linked</Text>
                          )}
                        </View>
                        {!isLinked && (
                          <Ionicons name="add-circle" size={24} color={theme.colors.success} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Policies Section */}
              {policies.length > 0 && (
                <>
                  <Text style={[styles.linkModalSectionTitle, assets.length > 0 && { marginTop: theme.spacing.xl }]}>
                    Policies ({policies.length})
                  </Text>
                  {policies.map(policy => {
                    const isLinked = (policyBeneficiaries[policy.policy_id] || []).some(
                      b => b.beneficiary_id === selectedBeneficiaryForLinking?.beneficiary_id
                    );

                    return (
                      <TouchableOpacity
                        key={policy.policy_id}
                        style={[
                          styles.linkModalItem,
                          isLinked && styles.linkModalItemDisabled,
                        ]}
                        onPress={() => !isLinked && handleLinkToAssetOrPolicy('policy', policy.policy_id)}
                        disabled={isLinked}
                      >
                        <View style={styles.linkModalItemIcon}>
                          <Ionicons
                            name={isLinked ? "checkmark-circle" : "document-text-outline"}
                            size={28}
                            color={isLinked ? theme.colors.success : theme.colors.primary}
                          />
                        </View>
                        <View style={styles.linkModalItemText}>
                          <Text style={[
                            styles.linkModalItemName,
                            isLinked && styles.linkModalItemNameDisabled,
                          ]}>
                            {policy.policy_number}
                          </Text>
                          <Text style={styles.linkModalItemSubtext}>
                            {policy.insurance_company} · {policy.policy_type.replace('_', ' ')}
                          </Text>
                          {isLinked && (
                            <Text style={styles.linkModalItemLinkedText}>Already linked</Text>
                          )}
                        </View>
                        {!isLinked && (
                          <Ionicons name="add-circle" size={24} color={theme.colors.success} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Empty State */}
              {assets.length === 0 && policies.length === 0 && (
                <View style={styles.linkModalEmpty}>
                  <Ionicons name="folder-open-outline" size={60} color={theme.colors.textSecondary} />
                  <Text style={styles.linkModalEmptyText}>No assets or policies yet</Text>
                  <Text style={styles.linkModalEmptySubtext}>
                    Add assets or policies to link beneficiaries
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Beneficiary Selection Modal */}
      <Modal
        visible={showBeneficiarySelectionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBeneficiarySelectionModal(false)}
      >
        <View style={styles.beneficiarySelectionOverlay}>
          <View style={styles.beneficiarySelectionContent}>
            <View style={styles.beneficiarySelectionHeader}>
              <Text style={styles.beneficiarySelectionTitle}>Add Beneficiary</Text>
              <TouchableOpacity onPress={() => setShowBeneficiarySelectionModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.beneficiarySelectionOption}
              onPress={handleCreateNewBeneficiary}
            >
              <View style={styles.beneficiarySelectionIconContainer}>
                <Ionicons name="person-add" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.beneficiarySelectionTextContainer}>
                <Text style={styles.beneficiarySelectionOptionTitle}>Create New Beneficiary</Text>
                <Text style={styles.beneficiarySelectionOptionSubtitle}>
                  Add a new beneficiary and link to this {beneficiarySelectionTarget?.type}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.beneficiarySelectionDivider}>
              <View style={styles.beneficiarySelectionDividerLine} />
              <Text style={styles.beneficiarySelectionDividerText}>OR</Text>
              <View style={styles.beneficiarySelectionDividerLine} />
            </View>

            <Text style={styles.beneficiarySelectionSubheading}>Select Existing Beneficiary</Text>

            <ScrollView 
              style={styles.beneficiarySelectionList}
              showsVerticalScrollIndicator={false}
            >
              {allBeneficiaries.length === 0 ? (
                <View style={styles.beneficiarySelectionEmpty}>
                  <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.beneficiarySelectionEmptyText}>
                    No existing beneficiaries yet
                  </Text>
                  <Text style={styles.beneficiarySelectionEmptySubtext}>
                    Create your first beneficiary to get started
                  </Text>
                </View>
              ) : (
                allBeneficiaries.map((beneficiary) => {
                  const isLinked = beneficiarySelectionTarget?.type === 'asset'
                    ? (assetBeneficiaries[beneficiarySelectionTarget?.id || ''] || []).some(
                        (b: BeneficiaryInformation) => b.beneficiary_id === beneficiary.beneficiary_id
                      )
                    : (policyBeneficiaries[beneficiarySelectionTarget?.id || ''] || []).some(
                        (b: BeneficiaryInformation) => b.beneficiary_id === beneficiary.beneficiary_id
                      );

                  const displayName =
                    beneficiary.beneficiary_name ||
                    `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_surname || ''}`.trim() ||
                    'Unnamed Beneficiary';

                  return (
                    <TouchableOpacity
                      key={beneficiary.beneficiary_id}
                      style={[
                        styles.beneficiarySelectionItem,
                        isLinked && styles.beneficiarySelectionItemDisabled,
                      ]}
                      onPress={() => !isLinked && handleSelectExistingBeneficiary(beneficiary)}
                      disabled={isLinked}
                    >
                      <View style={styles.beneficiarySelectionItemIcon}>
                        <Ionicons
                          name={isLinked ? "checkmark-circle" : "person-circle-outline"}
                          size={32}
                          color={isLinked ? theme.colors.success : theme.colors.primary}
                        />
                      </View>
                      <View style={styles.beneficiarySelectionItemText}>
                        <Text
                          style={[
                            styles.beneficiarySelectionItemName,
                            isLinked && styles.beneficiarySelectionItemNameDisabled,
                          ]}
                        >
                          {displayName}
                        </Text>
                        {beneficiary.relationship_to_user && (
                          <Text style={styles.beneficiarySelectionItemRelationship}>
                            {beneficiary.relationship_to_user}
                          </Text>
                        )}
                        {isLinked && (
                          <Text style={styles.beneficiarySelectionItemLinkedText}>
                            Already linked
                          </Text>
                        )}
                      </View>
                      {!isLinked && (
                        <Ionicons name="add-circle" size={24} color={theme.colors.success} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;
