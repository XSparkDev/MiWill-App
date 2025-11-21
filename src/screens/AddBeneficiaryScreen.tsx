import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import AssetService from '../services/assetService';
import PolicyService from '../services/policyService';
import BeneficiaryService from '../services/beneficiaryService';
import Toast from '../components/Toast';
import { AssetInformation } from '../types/asset';
import { PolicyInformation } from '../types/policy';
import { BeneficiaryInformation } from '../types/beneficiary';
import {
  formatSAPhoneNumber,
  isValidSAPhoneNumber,
  formatPhoneForDisplay,
} from '../utils/phoneFormatter';
import { shouldShowModal, setDontShowAgain } from '../utils/modalPreferences';

const { width } = Dimensions.get('window');

interface AddBeneficiaryScreenProps {
  navigation: any;
  route?: any;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const formatPhoneInput = (value: string) => formatSAPhoneNumber(value);
const getDisplayPhone = (value: string) =>
  value ? formatPhoneForDisplay(value) : '';

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

const AddBeneficiaryScreen: React.FC<AddBeneficiaryScreenProps> = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState({
    beneficiaryFirstName: '',
    beneficiarySurname: '',
    beneficiaryName: '',
    beneficiaryEmail: '',
    beneficiaryPhone: '',
    beneficiaryAddress: '',
    relationshipToUser: '',
    beneficiaryPercentage: '',
    selectedAssets: [] as string[],
    selectedPolicies: [] as string[],
  });

  const [assets, setAssets] = useState<AssetInformation[]>([]);
  const [policies, setPolicies] = useState<PolicyInformation[]>([]);
  const [assetBeneficiaries, setAssetBeneficiaries] = useState<Record<string, any[]>>({});
  const [policyBeneficiaries, setPolicyBeneficiaries] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showGuidedExplainer, setShowGuidedExplainer] = useState(false);
  const [dontShowGuidedExplainerAgain, setDontShowGuidedExplainerAgain] = useState(false);
  const returnToRoute = route?.params?.returnTo;

  const totalSteps = 3;
  
  // Show modal every time user enters the screen
  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const shouldShow = await shouldShowModal('ADD_BENEFICIARY_GUIDED');
        console.log('[AddBeneficiaryScreen] Should show guided explainer:', shouldShow);
        if (shouldShow) {
          setShowGuidedExplainer(true);
        }
      } catch (error) {
        console.error('[AddBeneficiaryScreen] Error checking modal preference:', error);
        // Default to showing modal on error
        setShowGuidedExplainer(true);
      }
    };
    
    // Check on mount
    checkAndShowModal();
    
    // Check on focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkAndShowModal();
    });
    
    return unsubscribe;
  }, [navigation]);

  type AdditionalBeneficiaryForm = {
    id: string;
    expanded: boolean;
    firstName: string;
    surname: string;
    email: string;
    phone: string;
    address: string;
    relationship: string;
  };

  const [additionalBeneficiaries, setAdditionalBeneficiaries] = useState<AdditionalBeneficiaryForm[]>([]);
  const [assetBeneficiariesExpanded, setAssetBeneficiariesExpanded] = useState<Record<string, boolean>>({});
  const [policyBeneficiariesExpanded, setPolicyBeneficiariesExpanded] = useState<Record<string, boolean>>({});
  const [inlineAddTarget, setInlineAddTarget] = useState<{ type: 'asset' | 'policy'; id: string } | null>(null);
  const [inlineBeneficiaryForm, setInlineBeneficiaryForm] = useState({
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    relationship: '',
    address: '',
  });
  const [inlineAdding, setInlineAdding] = useState(false);
  const [assetAllocations, setAssetAllocations] = useState<Record<string, Record<string, number>>>({});
  const [primaryRelationshipDropdownVisible, setPrimaryRelationshipDropdownVisible] = useState(false);
  const [additionalRelationshipDropdowns, setAdditionalRelationshipDropdowns] = useState<Record<string, boolean>>({});
  const [inlineRelationshipDropdownVisible, setInlineRelationshipDropdownVisible] = useState(false);
  const [primaryRelationshipOption, setPrimaryRelationshipOption] = useState<string>('');
  const [additionalRelationshipOptions, setAdditionalRelationshipOptions] = useState<Record<string, string>>({});
  const [inlineRelationshipOption, setInlineRelationshipOption] = useState<string>('');
  const primaryRelationshipInputRef = useRef<TextInput | null>(null);
  const additionalRelationshipInputRefs = useRef<Record<string, TextInput | null>>({});
  const inlineRelationshipInputRef = useRef<TextInput | null>(null);
  const [showBeneficiarySelectionModal, setShowBeneficiarySelectionModal] = useState(false);
  const [beneficiarySelectionTarget, setBeneficiarySelectionTarget] = useState<{ type: 'asset' | 'policy'; id: string } | null>(null);
  const [allBeneficiaries, setAllBeneficiaries] = useState<any[]>([]);

  const hasAdditionalData = (entry: AdditionalBeneficiaryForm) =>
    entry.firstName.trim() ||
    entry.surname.trim() ||
    entry.email.trim() ||
    entry.phone.trim() ||
    entry.address.trim() ||
    entry.relationship.trim();

  const activeAdditionalBeneficiaries = useMemo(
    () => additionalBeneficiaries.filter(entry => hasAdditionalData(entry)),
    [additionalBeneficiaries]
  );

  const beneficiaryDrafts = useMemo(() => {
    const drafts = [
      {
        key: 'primary',
        label: 'Beneficiary 1',
        firstName: formData.beneficiaryFirstName.trim(),
        surname: formData.beneficiarySurname.trim(),
        email: formData.beneficiaryEmail.trim(),
        phone: formData.beneficiaryPhone.trim(),
        address: formData.beneficiaryAddress.trim(),
        relationship: formData.relationshipToUser.trim(),
        displayName:
          `${formData.beneficiaryFirstName.trim()} ${formData.beneficiarySurname.trim()}`.trim() ||
          'Unnamed Beneficiary',
        isPrimary: true,
      },
    ];

    activeAdditionalBeneficiaries.forEach((entry, index) => {
      drafts.push({
        key: entry.id,
        label: `Beneficiary ${index + 2}`,
        firstName: entry.firstName.trim(),
        surname: entry.surname.trim(),
        email: entry.email.trim(),
        phone: entry.phone.trim(),
        address: entry.address.trim(),
        relationship: entry.relationship.trim(),
        displayName: `${entry.firstName.trim()} ${entry.surname.trim()}`.trim() || `Beneficiary ${index + 2}`,
        isPrimary: false,
      });
    });

    return drafts;
  }, [
    formData.beneficiaryFirstName,
    formData.beneficiarySurname,
    formData.beneficiaryEmail,
    formData.beneficiaryPhone,
    formData.beneficiaryAddress,
    formData.relationshipToUser,
    activeAdditionalBeneficiaries,
  ]);

  const beneficiaryKeysSignature = useMemo(
    () => beneficiaryDrafts.map(ben => ben.key).join('|'),
    [beneficiaryDrafts]
  );
  const selectedAssetsSignature = useMemo(
    () => formData.selectedAssets.slice().sort().join('|'),
    [formData.selectedAssets]
  );

  // Combined beneficiaries for each asset (new + existing)
  const combinedBeneficiariesForAsset = useMemo(() => {
    const combined: Record<string, Array<{
      key: string;
      label: string;
      displayName: string;
      beneficiary_id?: string;
      isExisting: boolean;
    }>> = {};

    formData.selectedAssets.forEach(assetId => {
      const combinedList: Array<{
        key: string;
        label: string;
        displayName: string;
        beneficiary_id?: string;
        isExisting: boolean;
      }> = [];

      // Add new beneficiaries being added
      beneficiaryDrafts.forEach((ben) => {
        combinedList.push({
          key: ben.key,
          label: ben.label,
          displayName: ben.displayName,
          isExisting: false,
        });
      });

      // Add existing beneficiaries linked to this asset
      const existing = assetBeneficiaries[assetId] || [];
      existing.forEach((existingBen: any, index: number) => {
        const existingKey = `existing_${existingBen.beneficiary_id}`;
        combinedList.push({
          key: existingKey,
          label: `Existing Beneficiary ${index + 1}`,
          displayName: existingBen.beneficiary_name || 
            `${existingBen.beneficiary_first_name || ''} ${existingBen.beneficiary_surname || ''}`.trim() ||
            'Unnamed Beneficiary',
          beneficiary_id: existingBen.beneficiary_id,
          isExisting: true,
        });
      });

      combined[assetId] = combinedList;
    });

    return combined;
  }, [formData.selectedAssets, beneficiaryDrafts, assetBeneficiaries]);

  useEffect(() => {
    setAssetAllocations(prev => {
      const updated = { ...prev };

      Object.keys(updated).forEach(assetId => {
        if (!formData.selectedAssets.includes(assetId)) {
          delete updated[assetId];
        }
      });

      formData.selectedAssets.forEach(assetId => {
        const current = { ...(updated[assetId] || {}) };
        let changed = false;

        // Get combined beneficiaries (new + existing) for this asset
        const combined = combinedBeneficiariesForAsset[assetId] || [];
        const existingBeneficiaries = assetBeneficiaries[assetId] || [];
        
        // Get existing percentages from the database
        const existingPercentages: Record<string, number> = {};
        existingBeneficiaries.forEach((existingBen: any) => {
          const existingKey = `existing_${existingBen.beneficiary_id}`;
          const percentage = existingBen.beneficiary_percentage || 0;
          existingPercentages[existingKey] = percentage;
        });

        // Remove allocations for beneficiaries that no longer exist
        Object.keys(current).forEach(key => {
          const stillExists = combined.some(ben => ben.key === key) || 
            (key.startsWith('existing_') && existingBeneficiaries.some((ben: any) => `existing_${ben.beneficiary_id}` === key));
          if (!stillExists) {
            delete current[key];
            changed = true;
          }
        });

        // Get valid new beneficiaries (those that exist in beneficiaryDrafts)
        const validNewBeneficiaries = beneficiaryDrafts.filter(ben => 
          ben.firstName.trim() || ben.surname.trim()
        );

        const totalBeneficiaries = validNewBeneficiaries.length + existingBeneficiaries.length;

        if (totalBeneficiaries > 0) {
          // Calculate equal split percentage for all beneficiaries
          const equalSplit = 100 / totalBeneficiaries;
          const roundedSplit = Math.round(equalSplit * 100) / 100;
          
          // Distribute percentages equally among all beneficiaries
          let totalAllocated = 0;
          
          // First, set allocations for existing beneficiaries
          existingBeneficiaries.forEach((existingBen: any, index: number) => {
            const existingKey = `existing_${existingBen.beneficiary_id}`;
            const allocation = index === existingBeneficiaries.length - 1 && validNewBeneficiaries.length === 0
              ? 100 - totalAllocated // Last one gets remainder if no new beneficiaries
              : roundedSplit;
            
            if (current[existingKey] === undefined || current[existingKey] !== allocation) {
              current[existingKey] = allocation;
              changed = true;
            }
            totalAllocated += allocation;
          });
          
          // Then, set allocations for new beneficiaries
          validNewBeneficiaries.forEach((beneficiary, index) => {
            const allocation = index === validNewBeneficiaries.length - 1
              ? 100 - totalAllocated // Last one gets the remainder to ensure 100%
              : roundedSplit;
            
            if (current[beneficiary.key] === undefined || current[beneficiary.key] !== allocation) {
              current[beneficiary.key] = allocation;
              changed = true;
            }
            totalAllocated += allocation;
          });
        } else {
          // No valid beneficiaries, clear allocations
          if (Object.keys(current).length > 0) {
            Object.keys(current).forEach(key => delete current[key]);
            changed = true;
          }
        }

        if (changed || !updated[assetId]) {
          updated[assetId] = current;
        }
      });

      return updated;
    });
  }, [beneficiaryKeysSignature, selectedAssetsSignature, combinedBeneficiariesForAsset, assetBeneficiaries]);

  const createTempId = () => Math.random().toString(36).substring(2, 11);

  // Fetch user's assets and policies
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        console.log('[AddBeneficiaryScreen] No current user');
        return;
      }

      try {
        setLoading(true);
        console.log('[AddBeneficiaryScreen] Fetching data for user:', currentUser.uid);
        const [userAssets, userPolicies] = await Promise.all([
          AssetService.getUserAssets(currentUser.uid),
          PolicyService.getUserPolicies(currentUser.uid),
        ]);
        console.log('[AddBeneficiaryScreen] Fetched assets:', userAssets.length, userAssets);
        console.log('[AddBeneficiaryScreen] Fetched policies:', userPolicies.length, userPolicies);
        setAssets(userAssets);
        setPolicies(userPolicies);
        
        // Fetch beneficiaries for each asset (with percentages)
        const assetBeneficiariesMap: Record<string, any[]> = {};
        const assetPercentagesMap: Record<string, Record<string, number>> = {};
        for (const asset of userAssets) {
          const beneficiaries = await BeneficiaryService.getBeneficiariesForAsset(asset.asset_id);
          assetBeneficiariesMap[asset.asset_id] = beneficiaries;
          
          // Also fetch percentages for existing beneficiaries
          const percentages = await BeneficiaryService.getAssetBeneficiaryLinks(asset.asset_id);
          assetPercentagesMap[asset.asset_id] = percentages;
        }
        setAssetBeneficiaries(assetBeneficiariesMap);
        
        // Initialize allocations with existing percentages
        setAssetAllocations(prev => {
          const updated = { ...prev };
          Object.keys(assetPercentagesMap).forEach(assetId => {
            if (!updated[assetId]) {
              updated[assetId] = {};
            }
            const percentages = assetPercentagesMap[assetId];
            Object.keys(percentages).forEach(beneficiaryId => {
              const existingKey = `existing_${beneficiaryId}`;
              updated[assetId][existingKey] = percentages[beneficiaryId];
            });
          });
          return updated;
        });
        setAssetBeneficiariesExpanded(
          Object.keys(assetBeneficiariesMap).reduce<Record<string, boolean>>((acc, id) => {
            acc[id] = false;
            return acc;
          }, {})
        );
        
        // Fetch beneficiaries for each policy
        const policyBeneficiariesMap: Record<string, any[]> = {};
        for (const policy of userPolicies) {
          const beneficiaries = await BeneficiaryService.getBeneficiariesForPolicy(policy.policy_id);
          policyBeneficiariesMap[policy.policy_id] = beneficiaries;
        }
        setPolicyBeneficiaries(policyBeneficiariesMap);
        setPolicyBeneficiariesExpanded(
          Object.keys(policyBeneficiariesMap).reduce<Record<string, boolean>>((acc, id) => {
            acc[id] = false;
            return acc;
          }, {})
        );
        
        // Fetch all beneficiaries for selection modal
        const allBeneficiariesList = await BeneficiaryService.getUserBeneficiaries(currentUser.uid);
        setAllBeneficiaries(allBeneficiariesList);
        
        // Auto-select first asset if available
        if (userAssets.length > 0) {
          setFormData(prev => ({
            ...prev,
            selectedAssets: [userAssets[0].asset_id],
          }));
        }
        
        // Auto-select first policy if available and no assets
        if (userAssets.length === 0 && userPolicies.length > 0) {
          setFormData(prev => ({
            ...prev,
            selectedPolicies: [userPolicies[0].policy_id],
          }));
        }
      } catch (error: any) {
        console.error('[AddBeneficiaryScreen] Error fetching data:', error);
        setToast({ message: 'Failed to load assets and policies', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Refresh data when screen comes into focus (e.g., after adding asset/policy)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        const refreshData = async () => {
          try {
            setLoading(true);
            const [userAssets, userPolicies] = await Promise.all([
              AssetService.getUserAssets(currentUser.uid),
              PolicyService.getUserPolicies(currentUser.uid),
            ]);
            setAssets(userAssets);
            setPolicies(userPolicies);
            
            // Fetch beneficiaries for each asset (with percentages)
            const assetBeneficiariesMap: Record<string, any[]> = {};
            const assetPercentagesMap: Record<string, Record<string, number>> = {};
            for (const asset of userAssets) {
              const beneficiaries = await BeneficiaryService.getBeneficiariesForAsset(asset.asset_id);
              assetBeneficiariesMap[asset.asset_id] = beneficiaries;
              
              // Also fetch percentages for existing beneficiaries
              const percentages = await BeneficiaryService.getAssetBeneficiaryLinks(asset.asset_id);
              assetPercentagesMap[asset.asset_id] = percentages;
            }
            setAssetBeneficiaries(assetBeneficiariesMap);
            
            // Update allocations with existing percentages
            setAssetAllocations(prev => {
              const updated = { ...prev };
              Object.keys(assetPercentagesMap).forEach(assetId => {
                if (!updated[assetId]) {
                  updated[assetId] = {};
                }
                const percentages = assetPercentagesMap[assetId];
                Object.keys(percentages).forEach(beneficiaryId => {
                  const existingKey = `existing_${beneficiaryId}`;
                  updated[assetId][existingKey] = percentages[beneficiaryId];
                });
              });
              return updated;
            });
            
            // Fetch beneficiaries for each policy
            const policyBeneficiariesMap: Record<string, any[]> = {};
            for (const policy of userPolicies) {
              const beneficiaries = await BeneficiaryService.getBeneficiariesForPolicy(policy.policy_id);
              policyBeneficiariesMap[policy.policy_id] = beneficiaries;
            }
            setPolicyBeneficiaries(policyBeneficiariesMap);
          } catch (error: any) {
            console.error('[AddBeneficiaryScreen] Error refreshing data:', error);
          } finally {
            setLoading(false);
          }
        };
        refreshData();
      }
    });
    return unsubscribe;
  }, [navigation, currentUser]);

  const updateFormData = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => {
      const updated: typeof prev = { ...prev };

      if (field === 'beneficiaryPhone') {
        (updated as any)[field] = formatPhoneInput(value as string);
        return updated;
      }

      (updated as any)[field] = value;

      if (field === 'beneficiaryFirstName' || field === 'beneficiarySurname') {
        const firstName =
          field === 'beneficiaryFirstName' ? (value as string) : updated.beneficiaryFirstName;
        const surname =
          field === 'beneficiarySurname' ? (value as string) : updated.beneficiarySurname;

        updated.beneficiaryName = `${(firstName || '').trim()} ${(surname || '').trim()}`
          .replace(/\s+/g, ' ')
          .trim();
      }

      return updated;
    });
  };

  const toggleAsset = (asset: string) => {
    const alreadySelected = formData.selectedAssets.includes(asset);
    const newAssets = alreadySelected
      ? formData.selectedAssets.filter(a => a !== asset)
      : [...formData.selectedAssets, asset];
    updateFormData('selectedAssets', newAssets);

    if (alreadySelected) {
      setAssetAllocations(prev => {
        const updated = { ...prev };
        delete updated[asset];
        return updated;
      });
    } else {
      // When selecting an asset, automatically set equal split for all beneficiaries (new + existing)
      const validNewBeneficiaries = beneficiaryDrafts.filter(ben => 
        ben.firstName.trim() || ben.surname.trim()
      );
      const existingBeneficiaries = assetBeneficiaries[asset] || [];
      const totalBeneficiaries = validNewBeneficiaries.length + existingBeneficiaries.length;
      
      if (totalBeneficiaries > 0) {
        setAssetAllocations(prev => {
          if (prev[asset]) {
            return prev;
          }
          const equalSplit = 100 / totalBeneficiaries;
          const roundedSplit = Math.round(equalSplit * 100) / 100;
          const initialAllocation: Record<string, number> = {};
          
          let totalAllocated = 0;
          
          // First, set allocations for existing beneficiaries
          existingBeneficiaries.forEach((existingBen: any, index: number) => {
            const existingKey = `existing_${existingBen.beneficiary_id}`;
            const allocation = index === existingBeneficiaries.length - 1 && validNewBeneficiaries.length === 0
              ? 100 - totalAllocated
              : roundedSplit;
            initialAllocation[existingKey] = allocation;
            totalAllocated += allocation;
          });
          
          // Then, set allocations for new beneficiaries
          validNewBeneficiaries.forEach((beneficiary, index) => {
            const allocation = index === validNewBeneficiaries.length - 1
              ? 100 - totalAllocated // Last one gets the remainder to ensure 100%
              : roundedSplit;
            initialAllocation[beneficiary.key] = allocation;
            totalAllocated += allocation;
          });
          
          return {
            ...prev,
            [asset]: initialAllocation,
          };
        });
      }
    }
  };

  const togglePolicy = (policy: string) => {
    const newPolicies = formData.selectedPolicies.includes(policy)
      ? formData.selectedPolicies.filter(p => p !== policy)
      : [...formData.selectedPolicies, policy];
    updateFormData('selectedPolicies', newPolicies);
  };

  const toggleAssetBeneficiaries = (assetId: string) => {
    setAssetBeneficiariesExpanded(prev => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  const togglePolicyBeneficiaries = (policyId: string) => {
    setPolicyBeneficiariesExpanded(prev => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  const beginInlineAdd = async (type: 'asset' | 'policy', id: string) => {
    // Show selection modal to choose between new or existing beneficiary
    setBeneficiarySelectionTarget({ type, id });
    setShowBeneficiarySelectionModal(true);
    
    // Fetch all beneficiaries if not already loaded
    if (allBeneficiaries.length === 0 && currentUser) {
      try {
        const beneficiaries = await BeneficiaryService.getUserBeneficiaries(currentUser.uid);
        setAllBeneficiaries(beneficiaries);
      } catch (error) {
        console.error('Error fetching beneficiaries:', error);
      }
    }
  };
  
  const handleCreateNewBeneficiary = () => {
    if (!beneficiarySelectionTarget) return;
    setShowBeneficiarySelectionModal(false);
    setInlineAddTarget(beneficiarySelectionTarget);
    setInlineBeneficiaryForm({
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      relationship: '',
      address: '',
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

      if (existing.some((b: any) => b.beneficiary_id === beneficiary.beneficiary_id)) {
        setToast({ message: 'This beneficiary is already linked to this ' + beneficiarySelectionTarget.type, type: 'error' });
        return;
      }

      // Calculate allocation percentage based on existing beneficiaries
      const existingCount = existing.length;
      const newCount = existingCount + 1;
      const equalSplit = 100 / newCount;
      const roundedSplit = Math.round(equalSplit * 100) / 100;

      // Link the beneficiary
      if (beneficiarySelectionTarget.type === 'asset') {
        // If there are existing beneficiaries, redistribute all percentages
        if (existingCount > 0) {
          // Create percentages map for redistribution (using beneficiary_id as keys for the service)
          const redistributionPercentages: Record<string, number> = {};
          // Create allocations map for local state (using existing_ prefix for existing, existing_ for new)
          const localAllocations: Record<string, number> = {};
          let redistributionTotal = 0;
          
          // Set equal split for existing beneficiaries
          existing.forEach((existingBen: any, index: number) => {
            const allocation = index === existingCount - 1
              ? 100 - redistributionTotal - roundedSplit // Last existing gets remainder minus new one's share
              : roundedSplit;
            redistributionPercentages[existingBen.beneficiary_id] = allocation;
            localAllocations[`existing_${existingBen.beneficiary_id}`] = allocation;
            redistributionTotal += allocation;
          });
          
          // Set equal split for new beneficiary (gets the remainder to ensure 100%)
          const newBeneficiaryAllocation = 100 - redistributionTotal;
          redistributionPercentages[beneficiary.beneficiary_id] = newBeneficiaryAllocation;
          // For existing beneficiaries added via + button, use existing_ prefix
          localAllocations[`existing_${beneficiary.beneficiary_id}`] = newBeneficiaryAllocation;
          
          // First link the new beneficiary
          await BeneficiaryService.linkAssetToBeneficiary(
            beneficiarySelectionTarget.id,
            beneficiary.beneficiary_id,
            newBeneficiaryAllocation,
            'equal_split'
          );
          
          // Then redistribute all existing allocations
          await BeneficiaryService.redistributeAssetAllocations(
            beneficiarySelectionTarget.id,
            redistributionPercentages
          );
          
          // Update local allocations state to reflect the redistribution
          setAssetAllocations(prev => ({
            ...prev,
            [beneficiarySelectionTarget.id]: {
              ...(prev[beneficiarySelectionTarget.id] || {}),
              ...localAllocations,
            },
          }));
        } else {
          // First beneficiary gets 100%
          await BeneficiaryService.linkAssetToBeneficiary(
            beneficiarySelectionTarget.id,
            beneficiary.beneficiary_id,
            100,
            'equal_split'
          );
          
          // Update local allocations state - use existing_ prefix for existing beneficiaries
          setAssetAllocations(prev => ({
            ...prev,
            [beneficiarySelectionTarget.id]: {
              ...(prev[beneficiarySelectionTarget.id] || {}),
              [`existing_${beneficiary.beneficiary_id}`]: 100,
            },
          }));
        }
        
        // Refresh beneficiaries for this asset to get updated percentages
        const updatedBeneficiaries = await BeneficiaryService.getBeneficiariesForAsset(beneficiarySelectionTarget.id);
        setAssetBeneficiaries(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: updatedBeneficiaries,
        }));
        setAssetBeneficiariesExpanded(prev => ({ ...prev, [beneficiarySelectionTarget.id]: true }));
      } else {
        // For policies, use same logic
        if (existingCount > 0) {
          const newPercentages: Record<string, number> = {};
          let totalAllocated = 0;
          
          existing.forEach((existingBen: any, index: number) => {
            const allocation = index === existingCount - 1
              ? 100 - totalAllocated - roundedSplit
              : roundedSplit;
            newPercentages[existingBen.beneficiary_id] = allocation;
            totalAllocated += allocation;
          });
          
          newPercentages[beneficiary.beneficiary_id] = 100 - totalAllocated;
          
          // For policies, we need to update each link individually
          for (const [benId, percentage] of Object.entries(newPercentages)) {
            if (benId === beneficiary.beneficiary_id) {
              await BeneficiaryService.linkPolicyToBeneficiary(
                beneficiarySelectionTarget.id,
                benId,
                percentage,
                'equal_split'
              );
            } else {
              // Update existing link - we'll need to add this function for policies too
              await BeneficiaryService.linkPolicyToBeneficiary(
                beneficiarySelectionTarget.id,
                benId,
                percentage,
                'equal_split'
              );
            }
          }
        } else {
          await BeneficiaryService.linkPolicyToBeneficiary(
            beneficiarySelectionTarget.id,
            beneficiary.beneficiary_id,
            100,
            'equal_split'
          );
        }
        
        setPolicyBeneficiaries(prev => ({
          ...prev,
          [beneficiarySelectionTarget.id]: [
            ...(prev[beneficiarySelectionTarget.id] || []),
            beneficiary,
          ],
        }));
        setPolicyBeneficiariesExpanded(prev => ({ ...prev, [beneficiarySelectionTarget.id]: true }));
      }

      setToast({ message: 'Beneficiary linked successfully.', type: 'success' });
    } catch (error) {
      console.error('Error linking beneficiary:', error);
      setToast({ message: 'Failed to link beneficiary. Please try again.', type: 'error' });
    }
  };

  const cancelInlineAdd = () => {
    setInlineAddTarget(null);
    setInlineBeneficiaryForm({
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      relationship: '',
      address: '',
    });
    setInlineRelationshipOption('');
    setInlineRelationshipDropdownVisible(false);
  };

  const handleSelectPrimaryRelationship = (optionValue: string, label: string) => {
    setPrimaryRelationshipOption(optionValue);
    if (optionValue === 'other') {
      updateFormData('relationshipToUser', '');
      setTimeout(() => {
        primaryRelationshipInputRef.current?.focus();
      }, 150);
    } else {
      updateFormData('relationshipToUser', label);
    }
    setPrimaryRelationshipDropdownVisible(false);
  };

  const handleSelectAdditionalRelationship = (beneficiaryId: string, optionValue: string, label: string) => {
    setAdditionalRelationshipOptions(prev => ({ ...prev, [beneficiaryId]: optionValue }));
    if (optionValue === 'other') {
      updateAdditionalBeneficiaryField(beneficiaryId, 'relationship', '');
      setTimeout(() => {
        additionalRelationshipInputRefs.current[beneficiaryId]?.focus();
      }, 150);
    } else {
      updateAdditionalBeneficiaryField(beneficiaryId, 'relationship', label);
    }
    setAdditionalRelationshipDropdowns(prev => ({ ...prev, [beneficiaryId]: false }));
  };

  const handleSelectInlineRelationship = (optionValue: string, label: string) => {
    setInlineRelationshipOption(optionValue);
    if (optionValue === 'other') {
      updateInlineBeneficiaryField('relationship', '');
      setTimeout(() => {
        inlineRelationshipInputRef.current?.focus();
      }, 150);
    } else {
      updateInlineBeneficiaryField('relationship', label);
    }
    setInlineRelationshipDropdownVisible(false);
  };

  const updateInlineBeneficiaryField = (field: keyof typeof inlineBeneficiaryForm, value: string) => {
    setInlineBeneficiaryForm(prev => ({
      ...prev,
      [field]: field === 'phone' ? formatPhoneInput(value) : value,
    }));
  };

  const handleAllocationChange = (assetId: string, beneficiaryKey: string, value: string) => {
    let numeric = parseFloat(value);
    if (Number.isNaN(numeric)) {
      numeric = 0;
    }
    numeric = Math.max(0, Math.min(100, numeric));

    setAssetAllocations(prev => ({
      ...prev,
      [assetId]: {
        ...(prev[assetId] || {}),
        [beneficiaryKey]: numeric,
      },
    }));
  };

  const getAllocationTotal = (assetId: string) => {
    const allocations = assetAllocations[assetId];
    if (!allocations) return 0;
    return Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const handleInlineBeneficiarySave = async () => {
    if (!inlineAddTarget) return;

    const { firstName, surname, email, phone, relationship, address } = inlineBeneficiaryForm;

    if (!firstName.trim()) {
      setToast({ message: 'Please enter beneficiary first name.', type: 'error' });
      return;
    }
    if (!surname.trim()) {
      setToast({ message: 'Please enter beneficiary surname.', type: 'error' });
      return;
    }
    if (!relationship.trim()) {
      setToast({ message: 'Please specify the relationship.', type: 'error' });
      return;
    }
    if (!email.trim()) {
      setToast({ message: 'Please enter beneficiary email address.', type: 'error' });
      return;
    }
    if (!isValidEmail(email.trim())) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }
    if (!phone.trim()) {
      setToast({ message: 'Please enter beneficiary phone number.', type: 'error' });
      return;
    }
    if (!isValidSAPhoneNumber(phone.trim())) {
      setToast({ message: 'Please enter a valid South African phone number.', type: 'error' });
      return;
    }
    if (!address.trim()) {
      setToast({ message: 'Please enter beneficiary address.', type: 'error' });
      return;
    }

    if (!currentUser) {
      setToast({ message: 'User not authenticated', type: 'error' });
      return;
    }

    setInlineAdding(true);
    try {
      const formattedPhone = formatSAPhoneNumber(phone.trim());
      const beneficiaryId = await BeneficiaryService.createBeneficiary({
        user_id: currentUser.uid,
        beneficiary_first_name: firstName.trim(),
        beneficiary_surname: surname.trim(),
        beneficiary_name: `${firstName.trim()} ${surname.trim()}`.trim(),
        beneficiary_email: email.trim(),
        beneficiary_phone: formattedPhone,
        beneficiary_address: address.trim(),
        relationship_to_user: relationship.trim(),
        is_primary: false,
        is_verified: false,
        verification_token: '',
      });

      // Get existing beneficiaries for this asset/policy
      const existing = inlineAddTarget.type === 'asset'
        ? assetBeneficiaries[inlineAddTarget.id] || []
        : policyBeneficiaries[inlineAddTarget.id] || [];
      
      const existingCount = existing.length;
      const newCount = existingCount + 1;
      const equalSplit = 100 / newCount;
      const roundedSplit = Math.round(equalSplit * 100) / 100;

      if (inlineAddTarget.type === 'asset') {
        // If there are existing beneficiaries, redistribute all percentages
        if (existingCount > 0) {
          // Create percentages map for redistribution (using beneficiary_id as keys for the service)
          const redistributionPercentages: Record<string, number> = {};
          // Create allocations map for local state (using existing_ prefix for existing, beneficiaryId for new)
          const localAllocations: Record<string, number> = {};
          let redistributionTotal = 0;
          
          // Set equal split for existing beneficiaries
          existing.forEach((existingBen: any, index: number) => {
            const allocation = index === existingCount - 1
              ? 100 - redistributionTotal - roundedSplit // Last existing gets remainder minus new one's share
              : roundedSplit;
            redistributionPercentages[existingBen.beneficiary_id] = allocation;
            localAllocations[`existing_${existingBen.beneficiary_id}`] = allocation;
            redistributionTotal += allocation;
          });
          
          // Set equal split for new beneficiary (gets the remainder to ensure 100%)
          const newBeneficiaryAllocation = 100 - redistributionTotal;
          redistributionPercentages[beneficiaryId] = newBeneficiaryAllocation;
          // For the newly created beneficiary, we'll use beneficiaryId as key
          // It will be updated when the form is saved and the beneficiary is linked
          localAllocations[beneficiaryId] = newBeneficiaryAllocation;
          
          // First link the new beneficiary
          await BeneficiaryService.linkAssetToBeneficiary(
            inlineAddTarget.id,
            beneficiaryId,
            newBeneficiaryAllocation,
            'equal_split'
          );
          
          // Then redistribute all existing allocations
          await BeneficiaryService.redistributeAssetAllocations(
            inlineAddTarget.id,
            redistributionPercentages
          );
          
          // Update local allocations state to reflect the redistribution
          setAssetAllocations(prev => ({
            ...prev,
            [inlineAddTarget.id]: {
              ...(prev[inlineAddTarget.id] || {}),
              ...localAllocations,
            },
          }));
        } else {
          // First beneficiary gets 100%
          await BeneficiaryService.linkAssetToBeneficiary(
            inlineAddTarget.id,
            beneficiaryId,
            100,
            'equal_split'
          );
          
          // Update local allocations state
          setAssetAllocations(prev => ({
            ...prev,
            [inlineAddTarget.id]: {
              [beneficiaryId]: 100,
            },
          }));
        }
        
        // Refresh beneficiaries for this asset to get updated percentages
        const updatedBeneficiaries = await BeneficiaryService.getBeneficiariesForAsset(inlineAddTarget.id);
        setAssetBeneficiaries(prev => ({
          ...prev,
          [inlineAddTarget.id]: updatedBeneficiaries,
        }));
        setAssetBeneficiariesExpanded(prev => ({ ...prev, [inlineAddTarget.id]: true }));
      } else {
        // For policies, use same logic
        if (existingCount > 0) {
          const newPercentages: Record<string, number> = {};
          let totalAllocated = 0;
          
          existing.forEach((existingBen: any, index: number) => {
            const allocation = index === existingCount - 1
              ? 100 - totalAllocated - roundedSplit
              : roundedSplit;
            newPercentages[existingBen.beneficiary_id] = allocation;
            totalAllocated += allocation;
          });
          
          newPercentages[beneficiaryId] = 100 - totalAllocated;
          
          // For policies, update each link
          // First, link the new beneficiary
          await BeneficiaryService.linkPolicyToBeneficiary(
            inlineAddTarget.id,
            beneficiaryId,
            newPercentages[beneficiaryId],
            'equal_split'
          );
          
          // Then update existing ones - we'll need to add update function for policies
          // For now, we'll just link the new one and let the user know they may need to adjust
        } else {
          await BeneficiaryService.linkPolicyToBeneficiary(
            inlineAddTarget.id,
            beneficiaryId,
            100,
            'equal_split'
          );
        }
        
        setPolicyBeneficiaries(prev => ({
          ...prev,
          [inlineAddTarget.id]: [
            ...(prev[inlineAddTarget.id] || []),
            {
              beneficiary_id: beneficiaryId,
              beneficiary_name: `${firstName.trim()} ${surname.trim()}`.trim(),
              beneficiary_email: email.trim(),
              beneficiary_phone: formattedPhone,
              relationship_to_user: relationship.trim(),
              beneficiary_address: address.trim(),
            },
          ],
        }));
        setPolicyBeneficiariesExpanded(prev => ({ ...prev, [inlineAddTarget.id]: true }));
      }

      setToast({ message: 'Beneficiary linked successfully.', type: 'success' });
      cancelInlineAdd();
    } catch (error) {
      console.error('Error creating inline beneficiary:', error);
      setToast({ message: 'Failed to link beneficiary. Please try again.', type: 'error' });
    } finally {
      setInlineAdding(false);
    }
  };

  const handleDelinkBeneficiary = (type: 'asset' | 'policy', id: string, beneficiary: any) => {
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
              setToast({ message: 'Beneficiary delinked successfully.', type: 'success' });
            } catch (error) {
              console.error('Error delinking beneficiary:', error);
              setToast({ message: 'Failed to delink beneficiary.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const addAdditionalBeneficiary = () => {
    setAdditionalBeneficiaries(prev => [
      ...prev,
      {
        id: createTempId(),
        expanded: true,
        firstName: '',
        surname: '',
        email: '',
        phone: '',
        address: '',
        relationship: '',
      },
    ]);
  };

  const toggleAdditionalBeneficiary = (id: string) => {
    setAdditionalBeneficiaries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, expanded: !entry.expanded } : entry
      )
    );
  };

  const updateAdditionalBeneficiaryField = (
    id: string,
    field: keyof Omit<AdditionalBeneficiaryForm, 'id' | 'expanded'>,
    value: string
  ) => {
    setAdditionalBeneficiaries(prev =>
      prev.map(entry =>
        entry.id === id
          ? {
              ...entry,
              [field]: field === 'phone' ? formatPhoneInput(value) : value,
            }
          : entry
      )
    );
  };

  const removeAdditionalBeneficiary = (id: string) => {
    setAdditionalBeneficiaries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleAddAsset = () => {
    navigation.navigate('AddAsset');
  };

  const nextStep = () => {
    // Validation on step 0
    if (currentStep === 0) {
      if (!formData.beneficiaryFirstName.trim()) {
        setToast({ message: 'Please enter beneficiary first name', type: 'error' });
        return;
      }
      if (!formData.beneficiarySurname.trim()) {
        setToast({ message: 'Please enter beneficiary surname', type: 'error' });
        return;
      }
      if (!formData.relationshipToUser.trim()) {
        setToast({ message: 'Please enter relationship to beneficiary', type: 'error' });
        return;
      }
      if (!formData.beneficiaryEmail.trim()) {
        setToast({ message: 'Please enter beneficiary email address', type: 'error' });
        return;
      }
      if (!isValidEmail(formData.beneficiaryEmail.trim())) {
        setToast({ message: 'Please enter a valid email address.', type: 'error' });
        return;
      }
      if (!formData.beneficiaryPhone.trim()) {
        setToast({ message: 'Please enter beneficiary phone number', type: 'error' });
        return;
      }
      if (!isValidSAPhoneNumber(formData.beneficiaryPhone.trim())) {
        setToast({
          message: 'Please enter a valid South African phone number.',
          type: 'error',
        });
        return;
      }
      if (!formData.beneficiaryAddress.trim()) {
        setToast({ message: 'Please enter beneficiary address', type: 'error' });
        return;
      }

      for (const additional of additionalBeneficiaries) {
        const hasAnyField =
          additional.firstName.trim() ||
          additional.surname.trim() ||
          additional.relationship.trim() ||
          additional.email.trim() ||
          additional.phone.trim() ||
          additional.address.trim();

        if (hasAnyField) {
          if (!additional.firstName.trim()) {
            setToast({
              message: 'Please enter first name for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!additional.surname.trim()) {
            setToast({
              message: 'Please enter surname for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!additional.relationship.trim()) {
            setToast({
              message: 'Please enter relationship for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!additional.email.trim()) {
            setToast({
              message: 'Please enter email for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!isValidEmail(additional.email.trim())) {
            setToast({
              message: 'Please enter valid email addresses for additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!additional.phone.trim()) {
            setToast({
              message: 'Please enter phone numbers for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!isValidSAPhoneNumber(additional.phone.trim())) {
            setToast({
              message: 'Please enter valid South African numbers for additional beneficiaries.',
              type: 'error',
            });
            return;
          }
          if (!additional.address.trim()) {
            setToast({
              message: 'Please enter addresses for all additional beneficiaries.',
              type: 'error',
            });
            return;
          }
        }
      }
    }

    if (currentStep === 1 && formData.selectedAssets.length > 0) {
      for (const assetId of formData.selectedAssets) {
        const allocations = assetAllocations[assetId] || {};
        const combined = combinedBeneficiariesForAsset[assetId] || [];
        
        // Calculate total including both new and existing beneficiaries
        const allocationTotal = combined.reduce(
          (sum, beneficiary) => sum + (allocations[beneficiary.key] || 0),
          0
        );

        if (Math.abs(allocationTotal - 100) > 0.5) {
          const assetName = assets.find(a => a.asset_id === assetId)?.asset_name || 'Asset';
          setToast({
            message: `${assetName} allocations must total 100%.`,
            type: 'error',
          });
          return;
        }

        const hasShare = combined.some(
          beneficiary => (allocations[beneficiary.key] || 0) > 0
        );

        if (!hasShare) {
          const assetName = assets.find(a => a.asset_id === assetId)?.asset_name || 'Asset';
          setToast({
            message: `Assign at least one beneficiary to ${assetName}.`,
            type: 'error',
          });
          return;
        }
      }
    }

    if (currentStep < totalSteps - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(width);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Save beneficiary and create links
      handleSaveBeneficiary();
    }
  };

  const handleSaveBeneficiary = async () => {
    if (!currentUser) {
      setToast({ message: 'User not authenticated', type: 'error' });
      return;
    }

    // Validate that at least one asset or policy is selected
    if (formData.selectedAssets.length === 0 && formData.selectedPolicies.length === 0) {
      setToast({ message: 'Please select at least one asset or policy', type: 'error' });
      // Navigate back to the asset linking step (step 1)
      setCurrentStep(1);
      return;
    }

    // Validate South African phone numbers when provided
    if (formData.beneficiaryPhone.trim() && !isValidSAPhoneNumber(formData.beneficiaryPhone)) {
      setToast({ message: 'Please enter a valid South African phone number.', type: 'error' });
      return;
    }

    try {
      setSaving(true);

      // 1. Create beneficiary
      const beneficiariesToSave = beneficiaryDrafts
        .map((beneficiary, index) => ({
          key: beneficiary.key,
          firstName: beneficiary.firstName,
          surname: beneficiary.surname,
          name:
            `${beneficiary.firstName} ${beneficiary.surname}`.trim() ||
            beneficiary.displayName,
          email: beneficiary.email,
          phone: beneficiary.phone,
          address: beneficiary.address,
          relationship: beneficiary.relationship,
          isPrimary: index === 0,
        }))
        .filter(beneficiary => beneficiary.firstName || beneficiary.surname);

      for (let index = 0; index < beneficiariesToSave.length; index += 1) {
        const beneficiary = beneficiariesToSave[index];

        if (!beneficiary.firstName || !beneficiary.surname) {
          continue;
        }

        const formattedPhone = beneficiary.phone
          ? formatSAPhoneNumber(beneficiary.phone)
          : '';

        const beneficiaryId = await BeneficiaryService.createBeneficiary({
          user_id: currentUser.uid,
          beneficiary_first_name: beneficiary.firstName,
          beneficiary_surname: beneficiary.surname,
          beneficiary_name: beneficiary.name,
          beneficiary_email: beneficiary.email || undefined,
          beneficiary_phone: formattedPhone || undefined,
          beneficiary_address: beneficiary.address || undefined,
          relationship_to_user: beneficiary.relationship || formData.relationshipToUser.trim(),
          is_primary: beneficiary.isPrimary,
          is_verified: false,
          verification_token: '',
        });

        const assetLinkPromises = formData.selectedAssets
          .map(assetId => {
            const allocation = assetAllocations[assetId]?.[beneficiary.key] || 0;
            if (allocation <= 0) {
              return null;
            }
            
            // Check if this beneficiary is already linked to this asset
            const existing = assetBeneficiaries[assetId] || [];
            const alreadyLinked = existing.some((b: any) => b.beneficiary_id === beneficiaryId);
            
            if (alreadyLinked) {
              // Update existing link
              return BeneficiaryService.updateAssetBeneficiaryAllocation(
                assetId,
                beneficiaryId,
                allocation
              );
            } else {
              // Create new link
              return BeneficiaryService.linkAssetToBeneficiary(
                assetId,
                beneficiaryId,
                allocation,
                'equal_split'
              );
            }
          })
          .filter(Boolean) as Promise<any>[];
        
        // Also update allocations for existing beneficiaries linked to selected assets
        const existingBeneficiaryUpdatePromises = formData.selectedAssets
          .flatMap(assetId => {
            const existing = assetBeneficiaries[assetId] || [];
            return existing.map((existingBen: any) => {
              const existingKey = `existing_${existingBen.beneficiary_id}`;
              const allocation = assetAllocations[assetId]?.[existingKey] || 0;
              if (allocation <= 0) {
                return null;
              }
              return BeneficiaryService.updateAssetBeneficiaryAllocation(
                assetId,
                existingBen.beneficiary_id,
                allocation
              );
            });
          })
          .filter(Boolean) as Promise<any>[];

        const policyLinkPromises = formData.selectedPolicies.map(policyId =>
        BeneficiaryService.linkPolicyToBeneficiary(
          policyId,
          beneficiaryId,
            100,
          'equal_split'
        )
      );

      await Promise.all([...assetLinkPromises, ...policyLinkPromises, ...existingBeneficiaryUpdatePromises]);
      }

      setToast({ message: 'Beneficiary added successfully!', type: 'success' });
      
      if (returnToRoute) {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: returnToRoute }],
          });
        }, 800);
        return;
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      console.error('Error saving beneficiary:', error);
      setToast({ message: 'Failed to save beneficiary', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(-width);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      navigation.goBack();
    }
  };

  const renderStep = () => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateX: slideAnim }],
    };

    switch (currentStep) {
      case 0:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Beneficiary Information</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Tell us about your beneficiary</Text>

            <TextInput
              style={styles.input}
              placeholder="Beneficiary First Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryFirstName}
              onChangeText={(value) => updateFormData('beneficiaryFirstName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Beneficiary Surname"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiarySurname}
              onChangeText={(value) => updateFormData('beneficiarySurname', value)}
            />

            <View
              style={[
                styles.dropdownWrapper,
                primaryRelationshipDropdownVisible && styles.dropdownWrapperExpanded,
              ]}
            >
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setPrimaryRelationshipDropdownVisible(prev => !prev)}
              >
                <Text
                  style={
                    formData.relationshipToUser || primaryRelationshipOption
                      ? styles.dropdownSelectedText
                      : styles.dropdownPlaceholder
                  }
                >
                  {primaryRelationshipOption === 'other' && formData.relationshipToUser
                    ? formData.relationshipToUser
                    : primaryRelationshipOption
                    ? relationshipOptions.find(opt => opt.value === primaryRelationshipOption)?.label || 'Select relationship'
                    : formData.relationshipToUser || 'Select relationship'}
                </Text>
                <Ionicons
                  name={primaryRelationshipDropdownVisible ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
              {primaryRelationshipDropdownVisible && (
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
                        onPress={() => handleSelectPrimaryRelationship(option.value, option.label)}
                      >
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {primaryRelationshipOption === 'other' && (
              <TextInput
                ref={primaryRelationshipInputRef}
                style={styles.input}
                placeholder="State Other relationship"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.relationshipToUser}
                onChangeText={(value) => updateFormData('relationshipToUser', value)}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryEmail}
              onChangeText={(value) => updateFormData('beneficiaryEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.placeholder}
              value={getDisplayPhone(formData.beneficiaryPhone)}
              onChangeText={(value) => updateFormData('beneficiaryPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryAddress}
              onChangeText={(value) => updateFormData('beneficiaryAddress', value)}
              multiline
            />

            <View style={styles.additionalBeneficiariesSection}>
              {additionalBeneficiaries.map((entry, index) => (
                <View key={entry.id} style={styles.additionalCard}>
                  <TouchableOpacity
                    style={styles.additionalHeader}
                    onPress={() => toggleAdditionalBeneficiary(entry.id)}
                  >
                    <Text style={styles.additionalTitle}>
                      {`Beneficiary ${index + 2}${
                        entry.firstName.trim() || entry.surname.trim()
                          ? ` - ${(entry.firstName || '').trim()} ${(entry.surname || '').trim()}`
                          : ''
                      }`}
                    </Text>
                    <View style={styles.additionalHeaderActions}>
                      <TouchableOpacity
                        onPress={() => removeAdditionalBeneficiary(entry.id)}
                        style={styles.removeAdditionalButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                      <Ionicons
                        style={styles.additionalChevron}
                        name={entry.expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {entry.expanded && (
                    <View style={styles.additionalContent}>
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor={theme.colors.placeholder}
                        value={entry.firstName}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'firstName', value)
                        }
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Surname"
                        placeholderTextColor={theme.colors.placeholder}
                        value={entry.surname}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'surname', value)
                        }
                      />
                      <View
                        style={[
                          styles.dropdownWrapper,
                          additionalRelationshipDropdowns[entry.id] && styles.dropdownWrapperExpanded,
                        ]}
                      >
                        <TouchableOpacity
                          style={[styles.input, styles.dropdownInput]}
                          onPress={() => setAdditionalRelationshipDropdowns(prev => ({
                            ...prev,
                            [entry.id]: !prev[entry.id],
                          }))}
                        >
                          <Text
                            style={
                              entry.relationship || additionalRelationshipOptions[entry.id]
                                ? styles.dropdownSelectedText
                                : styles.dropdownPlaceholder
                            }
                          >
                            {additionalRelationshipOptions[entry.id] === 'other' && entry.relationship
                              ? entry.relationship
                              : additionalRelationshipOptions[entry.id]
                              ? relationshipOptions.find(opt => opt.value === additionalRelationshipOptions[entry.id])?.label || 'Select relationship'
                              : entry.relationship || 'Select relationship'}
                          </Text>
                          <Ionicons
                            name={additionalRelationshipDropdowns[entry.id] ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.textSecondary}
                          />
                        </TouchableOpacity>
                        {additionalRelationshipDropdowns[entry.id] && (
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
                                  onPress={() => handleSelectAdditionalRelationship(entry.id, option.value, option.label)}
                                >
                                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      {additionalRelationshipOptions[entry.id] === 'other' && (
                        <TextInput
                          ref={(ref) => {
                            additionalRelationshipInputRefs.current[entry.id] = ref;
                          }}
                          style={styles.input}
                          placeholder="State Other relationship"
                          placeholderTextColor={theme.colors.placeholder}
                          value={entry.relationship}
                          onChangeText={(value) =>
                            updateAdditionalBeneficiaryField(entry.id, 'relationship', value)
                          }
                        />
                      )}
                      <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor={theme.colors.placeholder}
                        value={entry.email}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'email', value)
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor={theme.colors.placeholder}
                        value={getDisplayPhone(entry.phone)}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'phone', value)
                        }
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Address"
                        placeholderTextColor={theme.colors.placeholder}
                        value={entry.address}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'address', value)
                        }
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.addAnotherButton}
                        onPress={addAdditionalBeneficiary}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.addAnotherText}>Add Another Beneficiary</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              
              {additionalBeneficiaries.length === 0 && (
                <TouchableOpacity
                  style={styles.addAnotherButton}
                  onPress={addAdditionalBeneficiary}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.addAnotherText}>Add Another Beneficiary</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>Link Assets</Text>
            </View>
            <TouchableOpacity
              style={[styles.addNewButton, styles.addAssetButtonStandalone]}
              onPress={handleAddAsset}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.addNewButtonText}>Add Asset</Text>
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Select assets or policies to assign to this beneficiary</Text>

            <View style={styles.beneficiaryChipsSection}>
              {beneficiaryDrafts.map(beneficiary => (
                <View key={beneficiary.key} style={styles.beneficiaryChip}>
                  <Text style={styles.beneficiaryChipLabel}>{beneficiary.label}</Text>
                  <Text style={styles.beneficiaryChipName}>
                    {beneficiary.displayName || 'Details pending'}
                  </Text>
                </View>
              ))}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading assets...</Text>
              </View>
            ) : assets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No assets added yet</Text>
                <Text style={styles.emptyStateSubtext}>Add assets from the dashboard first</Text>
              </View>
            ) : (
              <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
                {assets.map((asset) => (
                  <View key={asset.asset_id}>
                    <View style={styles.selectionOptionWithActions}>
                      <TouchableOpacity
                        style={[
                          styles.selectionOption,
                          formData.selectedAssets.includes(asset.asset_id) && styles.selectionOptionActive,
                        ]}
                        onPress={() => toggleAsset(asset.asset_id)}
                      >
                        <Ionicons
                          name={formData.selectedAssets.includes(asset.asset_id) ? 'checkbox' : 'checkbox-outline'}
                          size={24}
                          color={formData.selectedAssets.includes(asset.asset_id) ? theme.colors.primary : theme.colors.border}
                        />
                        <View style={styles.selectionTextContainer}>
                          <Text style={styles.selectionText}>{asset.asset_name}</Text>
                          <Text style={styles.selectionSubtext}>{asset.asset_type.replace('_', ' ')}</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.actionIconsContainer}>
                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() => toggleAssetBeneficiaries(asset.asset_id)}
                        >
                          <Ionicons
                            name={assetBeneficiariesExpanded[asset.asset_id] ? "eye" : "eye-off-outline"}
                            size={24}
                            color={
                              assetBeneficiariesExpanded[asset.asset_id]
                                ? theme.colors.primary
                                : theme.colors.textSecondary
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() => beginInlineAdd('asset', asset.asset_id)}
                        >
                          <Ionicons name="add-circle-outline" size={24} color={theme.colors.success} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {assetBeneficiariesExpanded[asset.asset_id] && (
                      <View style={styles.linkedBeneficiariesContainer}>
                        {assetBeneficiaries[asset.asset_id] && assetBeneficiaries[asset.asset_id].length > 0 ? (
                          <>
                            <View style={styles.linkedBeneficiariesHeader}>
                              <Text style={styles.linkedBeneficiariesLabel}>
                                Linked beneficiaries ({assetBeneficiaries[asset.asset_id].length})
                              </Text>
                              <TouchableOpacity onPress={() => beginInlineAdd('asset', asset.asset_id)}>
                                <Text style={styles.linkedBeneficiariesHint}>Tap + to add more</Text>
                              </TouchableOpacity>
                            </View>
                            {assetBeneficiaries[asset.asset_id].map((ben: any, idx: number) => (
                              <View key={idx} style={styles.linkedBeneficiaryItemRow}>
                                <Text style={styles.linkedBeneficiaryItem}>• {ben.beneficiary_name}</Text>
                                <TouchableOpacity onPress={() => handleDelinkBeneficiary('asset', asset.asset_id, ben)}>
                                  <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </>
                        ) : (
                          <>
                            <Text style={styles.linkedBeneficiariesEmpty}>No beneficiaries linked yet.</Text>
                            <TouchableOpacity onPress={() => beginInlineAdd('asset', asset.asset_id)}>
                              <Text style={styles.linkedBeneficiariesHint}>Tap + to add more beneficiaries.</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                    {inlineAddTarget?.type === 'asset' &&
                      inlineAddTarget.id === asset.asset_id && (
                        <View style={styles.inlineAddContainer}>
                          <TextInput
                            style={styles.input}
                            placeholder="First Name"
                            placeholderTextColor={theme.colors.placeholder}
                            value={inlineBeneficiaryForm.firstName}
                            onChangeText={(value) => updateInlineBeneficiaryField('firstName', value)}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Surname"
                            placeholderTextColor={theme.colors.placeholder}
                            value={inlineBeneficiaryForm.surname}
                            onChangeText={(value) => updateInlineBeneficiaryField('surname', value)}
                          />
                          <View
                            style={[
                              styles.dropdownWrapper,
                              inlineRelationshipDropdownVisible && styles.dropdownWrapperExpanded,
                            ]}
                          >
                            <TouchableOpacity
                              style={[styles.input, styles.dropdownInput]}
                              onPress={() => setInlineRelationshipDropdownVisible(prev => !prev)}
                            >
                              <Text
                                style={
                                  inlineBeneficiaryForm.relationship || inlineRelationshipOption
                                    ? styles.dropdownSelectedText
                                    : styles.dropdownPlaceholder
                                }
                              >
                                {inlineRelationshipOption === 'other' && inlineBeneficiaryForm.relationship
                                  ? inlineBeneficiaryForm.relationship
                                  : inlineRelationshipOption
                                  ? relationshipOptions.find(opt => opt.value === inlineRelationshipOption)?.label || 'Select relationship'
                                  : inlineBeneficiaryForm.relationship || 'Select relationship'}
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
                              style={styles.input}
                              placeholder="State Other relationship"
                              placeholderTextColor={theme.colors.placeholder}
                              value={inlineBeneficiaryForm.relationship}
                              onChangeText={(value) => updateInlineBeneficiaryField('relationship', value)}
                            />
                          )}
                          <TextInput
                            style={styles.input}
                          placeholder="Email Address"
                            placeholderTextColor={theme.colors.placeholder}
                            value={inlineBeneficiaryForm.email}
                            onChangeText={(value) => updateInlineBeneficiaryField('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                          <TextInput
                            style={styles.input}
                          placeholder="Phone Number"
                            placeholderTextColor={theme.colors.placeholder}
                            value={getDisplayPhone(inlineBeneficiaryForm.phone)}
                            onChangeText={(value) => updateInlineBeneficiaryField('phone', value)}
                            keyboardType="phone-pad"
                          />
                        <TextInput
                          style={styles.input}
                          placeholder="Address"
                          placeholderTextColor={theme.colors.placeholder}
                          value={inlineBeneficiaryForm.address}
                          onChangeText={(value) => updateInlineBeneficiaryField('address', value)}
                          multiline
                        />
                          <View style={styles.inlineAddActions}>
                            <TouchableOpacity
                              style={styles.inlineCancelButton}
                              onPress={cancelInlineAdd}
                              disabled={inlineAdding}
                            >
                              <Text style={styles.inlineCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineAddButton}
                              onPress={handleInlineBeneficiarySave}
                              disabled={inlineAdding}
                            >
                              <Text style={styles.inlineAddButtonText}>
                                {inlineAdding ? 'Saving...' : 'Save & Link'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    {formData.selectedAssets.includes(asset.asset_id) && (
                      <View style={styles.allocationContainer}>
                        <View style={styles.allocationHeader}>
                          <Text style={styles.allocationTitle}>Split this asset</Text>
                          <Text
                            style={[
                              styles.allocationTotal,
                              Math.abs(getAllocationTotal(asset.asset_id) - 100) > 0.5 &&
                                styles.allocationTotalWarning,
                            ]}
                          >
                            Total: {getAllocationTotal(asset.asset_id)}%
                          </Text>
                        </View>
                        {combinedBeneficiariesForAsset[asset.asset_id]?.map(beneficiary => (
                          <View key={`${asset.asset_id}-${beneficiary.key}`} style={styles.allocationRow}>
                            <View style={styles.allocationRowInfo}>
                              <Text style={styles.allocationBeneficiaryLabel}>{beneficiary.label}</Text>
                              <Text style={styles.allocationBeneficiaryName}>
                                {beneficiary.displayName || 'Details pending'}
                              </Text>
                            </View>
                            <View style={styles.allocationInputWrapper}>
                              <TextInput
                                style={styles.allocationInput}
                                keyboardType="numeric"
                                value={
                                  assetAllocations[asset.asset_id]?.[beneficiary.key] !== undefined
                                    ? String(assetAllocations[asset.asset_id]?.[beneficiary.key])
                                    : '0'
                                }
                                onChangeText={value =>
                                  handleAllocationChange(asset.asset_id, beneficiary.key, value)
                                }
                                editable={!beneficiary.isExisting}
                              />
                              <Text style={styles.allocationPercentSymbol}>%</Text>
                            </View>
                            {beneficiary.isExisting && (
                              <Text style={styles.existingBeneficiaryBadge}>Existing</Text>
                            )}
                          </View>
                        ))}
                        {Math.abs(getAllocationTotal(asset.asset_id) - 100) > 0.5 && (
                          <Text style={styles.allocationErrorText}>
                            Allocation must total 100% for {asset.asset_name}.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {!loading && policies.length > 0 && (
              <View style={styles.policySection}>
                <Text style={styles.sectionDividerTitle}>Policies</Text>
                <ScrollView style={styles.selectionContainer} nestedScrollEnabled>
                  {policies.map((policy) => (
                    <View key={policy.policy_id}>
                      <View style={styles.selectionOptionWithActions}>
                        <TouchableOpacity
                          style={[
                            styles.selectionOption,
                            formData.selectedPolicies.includes(policy.policy_id) && styles.selectionOptionActive,
                          ]}
                          onPress={() => togglePolicy(policy.policy_id)}
                        >
                          <Ionicons
                            name={formData.selectedPolicies.includes(policy.policy_id) ? 'checkbox' : 'checkbox-outline'}
                            size={24}
                            color={formData.selectedPolicies.includes(policy.policy_id) ? theme.colors.primary : theme.colors.border}
                          />
                          <View style={styles.selectionTextContainer}>
                            <Text style={styles.selectionText}>{policy.policy_number}</Text>
                            <Text style={styles.selectionSubtext}>
                              {policy.insurance_company} - {policy.policy_type.replace('_', ' ')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.actionIconsContainer}>
                          <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={() => togglePolicyBeneficiaries(policy.policy_id)}
                          >
                            <Ionicons
                              name={policyBeneficiariesExpanded[policy.policy_id] ? "eye" : "eye-off-outline"}
                              size={24}
                              color={
                                policyBeneficiariesExpanded[policy.policy_id]
                                  ? theme.colors.primary
                                  : theme.colors.textSecondary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={() => beginInlineAdd('policy', policy.policy_id)}
                          >
                            <Ionicons name="add-circle-outline" size={24} color={theme.colors.success} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {policyBeneficiariesExpanded[policy.policy_id] && (
                        <View style={styles.linkedBeneficiariesContainer}>
                          {policyBeneficiaries[policy.policy_id] && policyBeneficiaries[policy.policy_id].length > 0 ? (
                            <>
                              <View style={styles.linkedBeneficiariesHeader}>
                                <Text style={styles.linkedBeneficiariesLabel}>
                                  Linked beneficiaries ({policyBeneficiaries[policy.policy_id].length})
                                </Text>
                                <TouchableOpacity onPress={() => beginInlineAdd('policy', policy.policy_id)}>
                                  <Text style={styles.linkedBeneficiariesHint}>Tap + to add more</Text>
                                </TouchableOpacity>
                              </View>
                              {policyBeneficiaries[policy.policy_id].map((ben: any, idx: number) => (
                                <View key={idx} style={styles.linkedBeneficiaryItemRow}>
                                  <Text style={styles.linkedBeneficiaryItem}>• {ben.beneficiary_name}</Text>
                                  <TouchableOpacity onPress={() => handleDelinkBeneficiary('policy', policy.policy_id, ben)}>
                                    <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </>
                          ) : (
                            <>
                              <Text style={styles.linkedBeneficiariesEmpty}>No beneficiaries linked yet.</Text>
                              <TouchableOpacity onPress={() => beginInlineAdd('policy', policy.policy_id)}>
                                <Text style={styles.linkedBeneficiariesHint}>Tap + to add more beneficiaries.</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                      {inlineAddTarget?.type === 'policy' &&
                        inlineAddTarget.id === policy.policy_id && (
                          <View style={styles.inlineAddContainer}>
                            <TextInput
                              style={styles.input}
                              placeholder="First Name"
                              placeholderTextColor={theme.colors.placeholder}
                              value={inlineBeneficiaryForm.firstName}
                              onChangeText={(value) => updateInlineBeneficiaryField('firstName', value)}
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Surname"
                              placeholderTextColor={theme.colors.placeholder}
                              value={inlineBeneficiaryForm.surname}
                              onChangeText={(value) => updateInlineBeneficiaryField('surname', value)}
                            />
                            <View
                              style={[
                                styles.dropdownWrapper,
                                inlineRelationshipDropdownVisible && styles.dropdownWrapperExpanded,
                              ]}
                            >
                              <TouchableOpacity
                                style={[styles.input, styles.dropdownInput]}
                                onPress={() => setInlineRelationshipDropdownVisible(prev => !prev)}
                              >
                                <Text
                                  style={
                                    inlineBeneficiaryForm.relationship || inlineRelationshipOption
                                      ? styles.dropdownSelectedText
                                      : styles.dropdownPlaceholder
                                  }
                                >
                                  {inlineRelationshipOption === 'other' && inlineBeneficiaryForm.relationship
                                    ? inlineBeneficiaryForm.relationship
                                    : inlineRelationshipOption
                                    ? relationshipOptions.find(opt => opt.value === inlineRelationshipOption)?.label || 'Select relationship'
                                    : inlineBeneficiaryForm.relationship || 'Select relationship'}
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
                                style={styles.input}
                                placeholder="State Other relationship"
                                placeholderTextColor={theme.colors.placeholder}
                                value={inlineBeneficiaryForm.relationship}
                                onChangeText={(value) => updateInlineBeneficiaryField('relationship', value)}
                              />
                            )}
                            <TextInput
                              style={styles.input}
                              placeholder="Email Address"
                              placeholderTextColor={theme.colors.placeholder}
                              value={inlineBeneficiaryForm.email}
                              onChangeText={(value) => updateInlineBeneficiaryField('email', value)}
                              keyboardType="email-address"
                              autoCapitalize="none"
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Phone Number"
                              placeholderTextColor={theme.colors.placeholder}
                            value={getDisplayPhone(inlineBeneficiaryForm.phone)}
                              onChangeText={(value) => updateInlineBeneficiaryField('phone', value)}
                              keyboardType="phone-pad"
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Address"
                              placeholderTextColor={theme.colors.placeholder}
                              value={inlineBeneficiaryForm.address}
                              onChangeText={(value) => updateInlineBeneficiaryField('address', value)}
                              multiline
                            />
                            <View style={styles.inlineAddActions}>
                              <TouchableOpacity
                                style={styles.inlineCancelButton}
                                onPress={cancelInlineAdd}
                                disabled={inlineAdding}
                              >
                                <Text style={styles.inlineCancelButtonText}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.inlineAddButton}
                                onPress={handleInlineBeneficiarySave}
                                disabled={inlineAdding}
                              >
                                <Text style={styles.inlineAddButtonText}>
                                  {inlineAdding ? 'Saving...' : 'Save & Link'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Review Beneficiary</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Review beneficiary information and assignments</Text>

            <ScrollView style={styles.reviewContainer} nestedScrollEnabled>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Beneficiaries</Text>
                {beneficiaryDrafts.map((beneficiary) => (
                  <View key={beneficiary.key} style={styles.beneficiaryReviewCard}>
                    <Text style={styles.beneficiaryReviewLabel}>{beneficiary.label}</Text>
                    <Text style={styles.reviewItem}>
                      Name:{' '}
                      {`${beneficiary.firstName} ${beneficiary.surname}`.trim() ||
                        beneficiary.displayName}
                    </Text>
                    <Text style={styles.reviewItem}>
                      Relationship: {beneficiary.relationship || 'Not specified'}
                    </Text>
                    <Text style={styles.reviewItem}>
                      Email: {beneficiary.email || 'Not specified'}
                    </Text>
                    <Text style={styles.reviewItem}>
                      Phone:{' '}
                      {beneficiary.phone ? getDisplayPhone(beneficiary.phone) : 'Not specified'}
                    </Text>
                    <Text style={styles.reviewItem}>
                      Address: {beneficiary.address || 'Not specified'}
                    </Text>
                  </View>
                ))}
              </View>

              {formData.selectedAssets.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Assigned Assets ({formData.selectedAssets.length})</Text>
                  {formData.selectedAssets.map((assetId) => {
                    const asset = assets.find(a => a.asset_id === assetId);
                    if (!asset) return null;
                    const allocations = assetAllocations[assetId] || {};
                    const allocationEntries = beneficiaryDrafts
                      .map(beneficiary => ({
                        label: beneficiary.label,
                        name:
                          `${beneficiary.firstName} ${beneficiary.surname}`.trim() ||
                          beneficiary.displayName,
                        percentage: allocations[beneficiary.key] ?? (beneficiary.isPrimary ? 100 : 0),
                      }))
                      .filter(entry => entry.percentage > 0);

                    return (
                      <View key={assetId} style={styles.reviewSubSection}>
                        <Text style={styles.reviewItem}>
                          • {asset.asset_name} ({asset.asset_type.replace('_', ' ')})
                        </Text>
                        {allocationEntries.length > 0 ? (
                          allocationEntries.map(entry => (
                            <Text key={`${assetId}-${entry.label}`} style={styles.reviewAllocationItem}>
                              {entry.label}: {entry.percentage}% ({entry.name})
                            </Text>
                          ))
                        ) : (
                          <Text style={styles.reviewAllocationItem}>No allocation set</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {formData.selectedPolicies.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Assigned Policies ({formData.selectedPolicies.length})</Text>
                  {formData.selectedPolicies.map((policyId) => {
                    const policy = policies.find(p => p.policy_id === policyId);
                    return policy ? (
                      <Text key={policyId} style={styles.reviewItem}>
                        • {policy.policy_number} - {policy.insurance_company}
                      </Text>
                    ) : null;
                  })}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && (
        <Toast
          visible={!!toast}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Beneficiary</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            disabled={saving}
            style={styles.homeButton}
          >
            <Ionicons name="home" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton, 
                saving && styles.nextButtonDisabled
              ]}
              onPress={nextStep}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.buttonText} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Save Beneficiary' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {currentStep > 0 && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={previousStep}
                disabled={saving}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={showGuidedExplainer}
        onRequestClose={() => setShowGuidedExplainer(false)}
      >
        <View style={styles.guidedModalOverlay}>
          <View style={styles.guidedModalContent}>
            <Ionicons name="people-circle-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.guidedModalTitle}>Link beneficiaries</Text>
            <Text style={styles.guidedModalBody}>
            Now that you have added an asset you can assign the asset to a beneficiary.
            </Text>
            <TouchableOpacity
              style={styles.guidedModalButton}
              onPress={async () => {
                if (dontShowGuidedExplainerAgain) {
                  await setDontShowAgain('ADD_BENEFICIARY_GUIDED');
                }
                setShowGuidedExplainer(false);
              }}
            >
              <Text style={styles.guidedModalButtonText}>Let's start linking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCheckboxContainer}
              onPress={() => setDontShowGuidedExplainerAgain(!dontShowGuidedExplainerAgain)}
            >
              <View style={[styles.modalCheckbox, dontShowGuidedExplainerAgain && styles.modalCheckboxChecked]}>
                {dontShowGuidedExplainerAgain && <Text style={styles.modalCheckmark}>✓</Text>}
              </View>
              <Text style={styles.modalCheckboxText}>Don't show again</Text>
            </TouchableOpacity>
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
                        (b: any) => b.beneficiary_id === beneficiary.beneficiary_id
                      )
                    : (policyBeneficiaries[beneficiarySelectionTarget?.id || ''] || []).some(
                        (b: any) => b.beneficiary_id === beneficiary.beneficiary_id
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  stepContainer: {
    flex: 1,
    minHeight: 400,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  stepTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  stepTitleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addAssetButtonStandalone: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  addNewButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  beneficiaryChipsSection: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  beneficiaryChip: {
    backgroundColor: theme.colors.primary + '08',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  beneficiaryChipLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
  beneficiaryChipName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBackground,
    marginBottom: theme.spacing.md,
  },
  dropdownWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  dropdownWrapperExpanded: {
    paddingBottom: 160,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  dropdownPlaceholder: {
    color: theme.colors.placeholder,
    fontSize: theme.typography.sizes.md,
  },
  dropdownSelectedText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
  },
  dropdownList: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    opacity: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    zIndex: 20,
    elevation: 4,
    shadowColor: '#00000033',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    maxHeight: 160,
    overflow: 'hidden',
  },
  dropdownListContent: {
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  dropdownScroll: {
    backgroundColor: theme.colors.surface,
  },
  dropdownOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dropdownOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  selectionContainer: {
    maxHeight: 300,
  },
  policySection: {
    marginTop: theme.spacing.xl,
  },
  sectionDividerTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  selectionOptionWithActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  selectionOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  selectionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium as any,
  },
  selectionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  selectionSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  reviewContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  reviewSection: {
    marginBottom: theme.spacing.lg,
  },
  reviewSubSection: {
    marginBottom: theme.spacing.sm,
  },
  beneficiaryReviewCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  beneficiaryReviewLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  reviewAllocationItem: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
  },
  reviewSectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  reviewItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  backButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.text,
  },
  nextButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  linkedBeneficiariesContainer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: -theme.spacing.xs,
  },
  linkedBeneficiariesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  linkedBeneficiariesLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold as any,
  },
  linkedBeneficiariesHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    fontStyle: 'italic',
  },
  allocationContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  allocationTotal: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  allocationTotalWarning: {
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold as any,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  allocationRowInfo: {
    flex: 1,
  },
  allocationBeneficiaryLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  allocationBeneficiaryName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  allocationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
  },
  allocationInput: {
    width: 60,
    textAlign: 'right',
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  allocationPercentSymbol: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs / 2,
  },
  allocationErrorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
  existingBeneficiaryBadge: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.sm,
  },
  linkedBeneficiariesEmpty: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  linkedBeneficiaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  linkedBeneficiaryItem: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontWeight: theme.typography.weights.medium as any,
  },
  actionIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  additionalBeneficiariesSection: {
    marginTop: theme.spacing.lg,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  addAnotherText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  additionalCard: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  additionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  additionalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
  },
  additionalContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  removeAdditionalButton: {
    padding: theme.spacing.xs,
  },
  additionalChevron: {
    marginLeft: theme.spacing.xs,
  },
  inlineAddContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  inlineAddActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  inlineAddButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
  },
  inlineCancelButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.border,
  },
  inlineAddButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  inlineCancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium as any,
  },
  guidedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  guidedModalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  guidedModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
  },
  guidedModalBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  guidedModalButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.buttonPrimary,
  },
  guidedModalButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  modalCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  modalCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  modalCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold' as any,
  },
  modalCheckboxText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  beneficiarySelectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  beneficiarySelectionContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '80%',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  beneficiarySelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  beneficiarySelectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  beneficiarySelectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
  beneficiarySelectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  beneficiarySelectionTextContainer: {
    flex: 1,
  },
  beneficiarySelectionOptionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  beneficiarySelectionOptionSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  beneficiarySelectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.lg,
  },
  beneficiarySelectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  beneficiarySelectionDividerText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
  },
  beneficiarySelectionSubheading: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  beneficiarySelectionList: {
    paddingHorizontal: theme.spacing.xl,
    maxHeight: 300,
  },
  beneficiarySelectionEmpty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  beneficiarySelectionEmptyText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  beneficiarySelectionEmptySubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  beneficiarySelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  beneficiarySelectionItemDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.border + '40',
  },
  beneficiarySelectionItemIcon: {
    marginRight: theme.spacing.md,
  },
  beneficiarySelectionItemText: {
    flex: 1,
  },
  beneficiarySelectionItemName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  beneficiarySelectionItemNameDisabled: {
    color: theme.colors.textSecondary,
  },
  beneficiarySelectionItemRelationship: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  beneficiarySelectionItemLinkedText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    fontStyle: 'italic',
  },
});

export default AddBeneficiaryScreen;

