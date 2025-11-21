import React, { useState, useRef, useEffect } from 'react';
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
import { formatSAPhoneNumber, isValidSAPhoneNumber } from '../utils/phoneFormatter';

const { width } = Dimensions.get('window');

interface AddBeneficiaryScreenProps {
  navigation: any;
  route?: any;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const formatPhoneInput = (value: string) => formatSAPhoneNumber(value);

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
  const fromGuidedFlow = route?.params?.fromGuidedFlow ?? false;
  const returnToRoute = route?.params?.returnTo;

  const totalSteps = 4;
  useEffect(() => {
    if (fromGuidedFlow) {
      setShowGuidedExplainer(true);
      navigation.setParams?.({ fromGuidedFlow: false });
    }
  }, [fromGuidedFlow, navigation]);

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
        
        // Fetch beneficiaries for each asset
        const assetBeneficiariesMap: Record<string, any[]> = {};
        for (const asset of userAssets) {
          const beneficiaries = await BeneficiaryService.getBeneficiariesForAsset(asset.asset_id);
          assetBeneficiariesMap[asset.asset_id] = beneficiaries;
        }
        setAssetBeneficiaries(assetBeneficiariesMap);
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
            
            // Fetch beneficiaries for each asset
            const assetBeneficiariesMap: Record<string, any[]> = {};
            for (const asset of userAssets) {
              const beneficiaries = await BeneficiaryService.getBeneficiariesForAsset(asset.asset_id);
              assetBeneficiariesMap[asset.asset_id] = beneficiaries;
            }
            setAssetBeneficiaries(assetBeneficiariesMap);
            
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
    const newAssets = formData.selectedAssets.includes(asset)
      ? formData.selectedAssets.filter(a => a !== asset)
      : [...formData.selectedAssets, asset];
    updateFormData('selectedAssets', newAssets);
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

  const beginInlineAdd = (type: 'asset' | 'policy', id: string) => {
    setInlineAddTarget({ type, id });
    setInlineBeneficiaryForm({
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      relationship: '',
      address: '',
    });
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
  };

  const updateInlineBeneficiaryField = (field: keyof typeof inlineBeneficiaryForm, value: string) => {
    setInlineBeneficiaryForm(prev => ({
      ...prev,
      [field]: field === 'phone' ? formatPhoneInput(value) : value,
    }));
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

      if (inlineAddTarget.type === 'asset') {
        await BeneficiaryService.linkAssetToBeneficiary(
          inlineAddTarget.id,
          beneficiaryId,
          100,
          'equal_split'
        );
        setAssetBeneficiaries(prev => ({
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
        setAssetBeneficiariesExpanded(prev => ({ ...prev, [inlineAddTarget.id]: true }));
      } else {
        await BeneficiaryService.linkPolicyToBeneficiary(
          inlineAddTarget.id,
          beneficiaryId,
          100,
          'equal_split'
        );
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

  const handleAddPolicy = () => {
    navigation.navigate('AddPolicy');
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
      const beneficiariesToSave = [
        {
          firstName: formData.beneficiaryFirstName.trim(),
          surname: formData.beneficiarySurname.trim(),
          name: formData.beneficiaryName.trim(),
          email: formData.beneficiaryEmail.trim(),
          phone: formatPhoneInput(formData.beneficiaryPhone.trim()),
          address: formData.beneficiaryAddress.trim(),
          relationship: formData.relationshipToUser.trim(),
        },
        ...additionalBeneficiaries
          .filter(entry =>
            entry.firstName.trim() ||
            entry.surname.trim() ||
            entry.email.trim() ||
            entry.phone.trim() ||
            entry.address.trim()
          )
          .map(entry => ({
            firstName: entry.firstName.trim(),
            surname: entry.surname.trim(),
            name: `${entry.firstName.trim()} ${entry.surname.trim()}`.trim(),
            email: entry.email.trim(),
            phone: formatPhoneInput(entry.phone.trim()),
            address: entry.address.trim(),
            relationship: entry.relationship.trim(),
          })),
      ];

      for (let index = 0; index < beneficiariesToSave.length; index += 1) {
        const beneficiary = beneficiariesToSave[index];

        if (!beneficiary.firstName || !beneficiary.surname) {
          continue;
        }

        const formattedPhone = formatSAPhoneNumber(beneficiary.phone);

        const beneficiaryId = await BeneficiaryService.createBeneficiary({
          user_id: currentUser.uid,
          beneficiary_first_name: beneficiary.firstName,
          beneficiary_surname: beneficiary.surname,
          beneficiary_name: beneficiary.name,
          beneficiary_email: beneficiary.email,
          beneficiary_phone: formattedPhone,
          beneficiary_address: beneficiary.address,
          relationship_to_user: beneficiary.relationship || formData.relationshipToUser.trim(),
          is_primary: index === 0,
          is_verified: false,
          verification_token: '',
        });

        const assetLinkPromises = formData.selectedAssets.map(assetId =>
          BeneficiaryService.linkAssetToBeneficiary(
            assetId,
            beneficiaryId,
            100,
            'equal_split'
          )
        );

        const policyLinkPromises = formData.selectedPolicies.map(policyId =>
          BeneficiaryService.linkPolicyToBeneficiary(
            policyId,
            beneficiaryId,
            100,
            'equal_split'
          )
        );

        await Promise.all([...assetLinkPromises, ...policyLinkPromises]);
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

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g., Spouse, Child, Friend)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.relationshipToUser}
              onChangeText={(value) => updateFormData('relationshipToUser', value)}
            />

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
              value={formData.beneficiaryPhone}
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
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={addAdditionalBeneficiary}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.addAnotherText}>Add Another Beneficiary</Text>
              </TouchableOpacity>

              {additionalBeneficiaries.map((entry, index) => (
                <View key={entry.id} style={styles.additionalCard}>
                  <TouchableOpacity
                    style={styles.additionalHeader}
                    onPress={() => toggleAdditionalBeneficiary(entry.id)}
                  >
                    <Text style={styles.additionalTitle}>
                      {(entry.firstName || entry.surname)
                        ? `${entry.firstName} ${entry.surname}`.trim()
                        : `Additional Beneficiary ${index + 1}`}
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
                      <TextInput
                        style={styles.input}
                        placeholder="Relationship"
                        placeholderTextColor={theme.colors.placeholder}
                        value={entry.relationship}
                        onChangeText={(value) =>
                          updateAdditionalBeneficiaryField(entry.id, 'relationship', value)
                        }
                      />
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
                        value={entry.phone}
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
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>Link Assets</Text>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={handleAddAsset}
              >
                <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                <Text style={styles.addNewButtonText}>Add Asset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Select assets to assign to this beneficiary</Text>

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
                          <TextInput
                            style={styles.input}
                            placeholder="Relationship"
                            placeholderTextColor={theme.colors.placeholder}
                            value={inlineBeneficiaryForm.relationship}
                            onChangeText={(value) => updateInlineBeneficiaryField('relationship', value)}
                          />
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
                            value={inlineBeneficiaryForm.phone}
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
            )}
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>Link Policies</Text>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={handleAddPolicy}
              >
                <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                <Text style={styles.addNewButtonText}>Add Policy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Select policies to assign to this beneficiary</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading policies...</Text>
              </View>
            ) : policies.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No policies added yet</Text>
                <Text style={styles.emptyStateSubtext}>Add policies from the dashboard first</Text>
              </View>
            ) : (
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
                          <TextInput
                            style={styles.input}
                            placeholder="Relationship"
                            placeholderTextColor={theme.colors.placeholder}
                            value={inlineBeneficiaryForm.relationship}
                            onChangeText={(value) => updateInlineBeneficiaryField('relationship', value)}
                          />
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
                            value={inlineBeneficiaryForm.phone}
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
            )}
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Review Beneficiary</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Review beneficiary information and assignments</Text>

            <ScrollView style={styles.reviewContainer} nestedScrollEnabled>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Beneficiary Details</Text>
                <Text style={styles.reviewItem}>
                  Name: {(formData.beneficiaryName || '').trim()}
                </Text>
                <Text style={styles.reviewItem}>
                  First Name: {formData.beneficiaryFirstName}
                </Text>
                <Text style={styles.reviewItem}>Surname: {formData.beneficiarySurname}</Text>
                <Text style={styles.reviewItem}>Relationship: {formData.relationshipToUser}</Text>
                {formData.beneficiaryEmail && (
                  <Text style={styles.reviewItem}>Email: {formData.beneficiaryEmail}</Text>
                )}
                {formData.beneficiaryPhone && (
                  <Text style={styles.reviewItem}>Phone: {formData.beneficiaryPhone}</Text>
                )}
                {formData.beneficiaryAddress && (
                  <Text style={styles.reviewItem}>Address: {formData.beneficiaryAddress}</Text>
                )}
              </View>

              {additionalBeneficiaries.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Additional Beneficiaries</Text>
                  {additionalBeneficiaries
                    .filter(entry =>
                      entry.firstName.trim() ||
                      entry.surname.trim() ||
                      entry.relationship.trim()
                    )
                    .map((entry, idx) => (
                      <View key={entry.id || idx} style={styles.reviewSubSection}>
                        <Text style={styles.reviewItem}>
                          {`${entry.firstName} ${entry.surname}`.trim()}
                        </Text>
                        {entry.relationship.trim() ? (
                          <Text style={styles.reviewItem}>
                            Relationship: {entry.relationship.trim()}
                          </Text>
                        ) : null}
                        {entry.email.trim() ? (
                          <Text style={styles.reviewItem}>Email: {entry.email.trim()}</Text>
                        ) : null}
                        {entry.phone.trim() ? (
                          <Text style={styles.reviewItem}>Phone: {entry.phone.trim()}</Text>
                        ) : null}
                        {entry.address.trim() ? (
                          <Text style={styles.reviewItem}>Address: {entry.address.trim()}</Text>
                        ) : null}
                      </View>
                    ))}
                </View>
              )}

              {formData.selectedAssets.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Assigned Assets ({formData.selectedAssets.length})</Text>
                  {formData.selectedAssets.map((assetId) => {
                    const asset = assets.find(a => a.asset_id === assetId);
                    return asset ? (
                      <Text key={assetId} style={styles.reviewItem}>
                        • {asset.asset_name} ({asset.asset_type.replace('_', ' ')})
                      </Text>
                    ) : null;
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
          <View style={{ width: 24 }} />
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
              Select the assets or policies on each step to assign who should receive them. You can split percentages or add more beneficiaries later.
            </Text>
            <TouchableOpacity
              style={styles.guidedModalButton}
              onPress={() => setShowGuidedExplainer(false)}
            >
              <Text style={styles.guidedModalButtonText}>Let’s start linking</Text>
            </TouchableOpacity>
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
  selectionContainer: {
    maxHeight: 300,
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
});

export default AddBeneficiaryScreen;

