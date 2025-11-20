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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import AssetService from '../services/assetService';
import Toast from '../components/Toast';
import { formatCurrencyInput, parseCurrency } from '../utils/currencyFormatter';
import {
  AssetType,
  FinancingStatus,
  FinanceProviderType,
} from '../types/asset';

const { width } = Dimensions.get('window');

interface AddAssetScreenProps {
  navigation: any;
  route?: any;
}

const assetTypes: AssetType[] = [
  'property',
  'vehicle',
  'policy',
  'bank_account',
  'investment',
  'jewelry',
  'artwork',
  'business',
  'other',
];

const financingOptions: { key: FinancingStatus; label: string }[] = [
  { key: 'financed', label: 'Financed' },
  { key: 'owned', label: 'Owned outright' },
];

const financeProviderTypes: { key: Exclude<FinanceProviderType, 'owned'>; label: string }[] = [
  { key: 'bank', label: 'Bank' },
  { key: 'other', label: 'Other' },
];

const banksAndFintechs: string[] = [
  'Absa',
  'African Bank',
  'Bidvest Bank',
  'Capitec',
  'Discovery Bank',
  'FNB',
  'Investec',
  'Nedbank',
  'Old Mutual',
  'Standard Bank',
  'TymeBank',
  'RainFin',
  'African Rainbow Capital',
  'Other',
];

const assetTypeDescriptions: Record<string, { title: string; subtitle: string }> = {
  property: {
    title: 'Property Asset Guide',
    subtitle:
      'Include residential or commercial properties. Clearly document ownership, outstanding bonds, and any co-owners. Percentages are typically required for property allocations.',
  },
  vehicle: {
    title: 'Vehicle Asset Guide',
    subtitle:
      'List motor vehicles, motorcycles, or boats. Provide registration details and note any finance agreements. Vehicles usually transfer in full—percentage allocation is not necessary.',
  },
  bank_account: {
    title: 'Bank Account Guide',
    subtitle:
      'Capture bank name, account type, and account number. Indicate whether it is a joint account. Consult an attorney on estate liquidity and settlement nuances.',
  },
  investment: {
    title: 'Investment Asset Guide',
    subtitle:
      'Include unit trusts, retirement funds, or stock portfolios. Ensure beneficiary designations align with the policy rules. Percentages help clarify asset splits.',
  },
  jewelry: {
    title: 'Jewelry Asset Guide',
    subtitle:
      'Detail significant jewellery pieces with descriptions and appraisals if available. These items generally transfer as a whole, so a percentage is not required.',
  },
  artwork: {
    title: 'Artwork Asset Guide',
    subtitle:
      'Document art collections, provenance, and valuation certificates. Artwork can be bequeathed outright—percentage allocation is usually unnecessary.',
  },
  business: {
    title: 'Business Asset Guide',
    subtitle:
      'Outline the business entity, shareholding breakdown, and succession wishes. Consult legal counsel to ensure alignment with shareholder agreements and tax obligations.',
  },
  policy: {
    title: 'Policy Asset Guide',
    subtitle:
      'Policies are managed in their dedicated section. You will be redirected to capture policy numbers, insurers, and beneficiary notes so we can keep them in sync with your estate plan.',
  },
  other: {
    title: 'Other Asset Guide',
    subtitle:
      'Use this category for assets that do not fit the predefined list. Include as much detail as possible so that executors understand your intentions.',
  },
};

type AssetFormState = {
  assetName: string;
  assetType: AssetType | '';
  otherAssetType: string;
  assetDescription: string;
  assetValue: string;
  assetLocation: string;
  financingStatus: FinancingStatus | '';
  financeProviderType: Exclude<FinanceProviderType, 'owned'> | '';
  financeProviderName: string;
  financeProviderOther: string;
  datePurchased: string;
  repaymentTerm: string;
  paidUpDate: string;
};

const formatDateInput = (value: string): string => {
  const digitsOnly = value.replace(/[^\d]/g, '').slice(0, 8);
  const parts = [];
  if (digitsOnly.length >= 4) {
    parts.push(digitsOnly.slice(0, 4));
    if (digitsOnly.length >= 6) {
      parts.push(digitsOnly.slice(4, 6));
      const day = digitsOnly.slice(6);
      if (day) {
        parts.push(day);
      }
    } else {
      parts.push(digitsOnly.slice(4));
    }
  } else {
    parts.push(digitsOnly);
  }
  return parts.filter(Boolean).join('-');
};

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (day > (isLeap ? 29 : 28)) return false;
  }
  return true;
};

const AddAssetScreen: React.FC<AddAssetScreenProps> = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; subtitle: string } | null>(null);
  const [showPolicyRedirectModal, setShowPolicyRedirectModal] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [showLinkExplainerModal, setShowLinkExplainerModal] = useState(false);
  const [linkExplainerShown, setLinkExplainerShown] = useState(false);

  const [formData, setFormData] = useState<AssetFormState>({
    assetName: '',
    assetType: '',
    otherAssetType: '',
    assetDescription: '',
    assetValue: '',
    assetLocation: '',
    financingStatus: '',
    financeProviderType: '',
    financeProviderName: '',
    financeProviderOther: '',
    datePurchased: '',
    repaymentTerm: '',
    paidUpDate: '',
  });

  const totalSteps = 3;
  const fromGuidedWill = route?.params?.fromGuidedWill ?? false;

  useEffect(() => {
    if (route?.params?.showFirstTimeExplainer) {
      setShowFirstTimeModal(true);
    }
  }, [route?.params?.showFirstTimeExplainer]);

  const updateFormData = (field: keyof AssetFormState, value: string) => {
    if (field === 'assetValue') {
      const formatted = formatCurrencyInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
      return;
    }
    if (field === 'datePurchased' || field === 'paidUpDate') {
      const formatted = formatDateInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
      return;
    }
    if (field === 'assetType') {
      setFormData(prev => ({
        ...prev,
        assetType: value as AssetType | '',
        otherAssetType: value === 'other' ? prev.otherAssetType : '',
      }));
      return;
    }
    if (field === 'financingStatus') {
      setFormData(prev => ({
        ...prev,
        financingStatus: value as FinancingStatus | '',
        financeProviderType: value === 'financed' ? prev.financeProviderType : '',
        financeProviderName: value === 'financed' ? prev.financeProviderName : '',
        financeProviderOther: value === 'financed' ? prev.financeProviderOther : '',
        repaymentTerm: value === 'financed' ? prev.repaymentTerm : '',
        paidUpDate: value === 'financed' ? prev.paidUpDate : '',
      }));
      return;
    }
    if (field === 'financeProviderType') {
      setFormData(prev => ({
        ...prev,
        financeProviderType: value as Exclude<FinanceProviderType, 'owned'> | '',
        financeProviderName: value === 'bank' ? prev.financeProviderName : '',
        financeProviderOther: value === 'other' ? prev.financeProviderOther : '',
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssetTypePress = (type: string) => {
    if (type === 'policy') {
      setShowPolicyRedirectModal(true);
      return;
    }
    updateFormData('assetType', type);
  };

  const handleLinkBeneficiaryRequest = () => {
    if (fromGuidedWill && !linkExplainerShown) {
      setShowLinkExplainerModal(true);
    } else {
      handleSaveAsset('link');
    }
  };

  const getAssetDisclaimer = (): string => {
    return 'Read more about asset class, please consult an attorney for further information';
  };

  const openAssetInfo = (assetType: string) => {
    if (!assetType) return;
    const content = assetTypeDescriptions[assetType] ?? assetTypeDescriptions.other;
    setInfoModalContent(content);
    setInfoModalVisible(true);
  };

  const closeAssetInfo = () => {
    setInfoModalVisible(false);
    setInfoModalContent(null);
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      // Validate required fields before proceeding
      if (currentStep === 0) {
        if (!formData.assetName.trim()) {
          setToastMessage('Please enter an asset name');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.assetType) {
          setToastMessage('Please select an asset type');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (formData.assetType === 'other' && !formData.otherAssetType.trim()) {
          setToastMessage('Please specify your asset type');
          setToastType('error');
          setShowToast(true);
          return;
        }
      } else if (currentStep === 1) {
        if (!formData.assetValue.trim()) {
          setToastMessage('Please enter an asset value');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.assetLocation.trim()) {
          setToastMessage('Please enter an asset location');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.financingStatus) {
          setToastMessage('Please select a financing status');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (formData.financingStatus === 'financed') {
          if (!formData.financeProviderType) {
            setToastMessage('Please select a finance provider type');
            setToastType('error');
            setShowToast(true);
            return;
          }
          if (formData.financeProviderType === 'bank' && !formData.financeProviderName) {
            setToastMessage('Please choose a bank or fintech provider');
            setToastType('error');
            setShowToast(true);
            return;
          }
          if (formData.financeProviderType === 'other' && !formData.financeProviderOther.trim()) {
            setToastMessage('Please specify the finance provider');
            setToastType('error');
            setShowToast(true);
            return;
          }
          if (!formData.repaymentTerm.trim()) {
            setToastMessage('Please enter the repayment term');
            setToastType('error');
            setShowToast(true);
            return;
          }
          if (!formData.paidUpDate.trim()) {
            setToastMessage('Please enter the paid-up date');
            setToastType('error');
            setShowToast(true);
            return;
          }
          if (!isValidDateString(formData.paidUpDate.trim())) {
            setToastMessage('Paid-up date must be in YYYY-MM-DD format');
            setToastType('error');
            setShowToast(true);
            return;
          }
        }
        if (!formData.datePurchased.trim()) {
          setToastMessage('Please enter the purchase date');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!isValidDateString(formData.datePurchased.trim())) {
          setToastMessage('Purchase date must be in YYYY-MM-DD format');
          setToastType('error');
          setShowToast(true);
          return;
        }
      }

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
      // Save asset to Firebase
      await handleSaveAsset();
    }
  };

  const handleSaveAsset = async (nextAction: 'back' | 'link' = 'back') => {
    if (!currentUser) {
      setToastMessage('You must be logged in to add an asset');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      setSaving(true);

      const financingStatus = formData.financingStatus as FinancingStatus;
      const financeProviderType: FinanceProviderType =
        financingStatus === 'financed'
          ? ((formData.financeProviderType as FinanceProviderType) || 'bank')
          : 'owned';

      await AssetService.createAsset({
        user_id: currentUser.uid,
        asset_name: formData.assetName.trim(),
        asset_type:
          formData.assetType === 'other'
            ? formData.otherAssetType.trim()
            : (formData.assetType as any),
        asset_description: formData.assetDescription.trim() || undefined,
        asset_value: parseCurrency(formData.assetValue),
        asset_location: formData.assetLocation.trim(),
        financing_status: financingStatus,
        finance_provider_type: financeProviderType,
        finance_provider_name:
          financingStatus === 'financed' && financeProviderType === 'bank'
            ? formData.financeProviderName
            : undefined,
        finance_provider_other:
          financingStatus === 'financed' && financeProviderType === 'other'
            ? formData.financeProviderOther.trim()
            : undefined,
        date_purchased: formData.datePurchased.trim(),
        repayment_term:
          financingStatus === 'financed' ? formData.repaymentTerm.trim() : undefined,
        paid_up_date:
          financingStatus === 'financed' ? formData.paidUpDate.trim() : undefined,
        is_active: true,
      });

      setToastMessage('Asset added successfully!');
      setToastType('success');
      setShowToast(true);

      if (nextAction === 'link') {
        navigation.navigate('AddBeneficiary', {
          fromGuidedFlow: fromGuidedWill,
          returnTo: fromGuidedWill ? 'Dashboard' : undefined,
        });
      } else {
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to save asset');
      setToastType('error');
      setShowToast(true);
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
            <Text style={styles.stepTitle}>Asset Information</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Tell us about your asset</Text>

            <TextInput
              style={styles.input}
              placeholder="Asset Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.assetName}
              onChangeText={(value) => updateFormData('assetName', value)}
            />

            <Text style={styles.label}>Asset Type</Text>
            <ScrollView style={styles.typeContainer} nestedScrollEnabled>
              {assetTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.assetType === type && styles.typeOptionActive,
                  ]}
                  onPress={() => handleAssetTypePress(type)}
                >
                  <Text style={styles.typeText}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {formData.assetType === 'other' && (
              <TextInput
                style={styles.input}
                placeholder="Specify asset type"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.otherAssetType}
                onChangeText={(value) => updateFormData('otherAssetType', value)}
              />
            )}

            {formData.assetType && (
              <TouchableOpacity style={styles.disclaimerBox} onPress={() => openAssetInfo(formData.assetType)}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.disclaimerText}>{getAssetDisclaimer()}</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.input}
              placeholder="Description (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.assetDescription}
              onChangeText={(value) => updateFormData('assetDescription', value)}
              multiline
            />
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Asset Details</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Additional information about your asset</Text>

            <TextInput
              style={styles.input}
              placeholder="Asset Value"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.assetValue}
              onChangeText={(value) => updateFormData('assetValue', value)}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Financing Status</Text>
            <View style={styles.financingOptionsContainer}>
              {financingOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.financingOption,
                    formData.financingStatus === option.key && styles.financingOptionActive,
                  ]}
                  onPress={() => updateFormData('financingStatus', option.key)}
                >
                  <Text
                    style={[
                      styles.financingOptionText,
                      formData.financingStatus === option.key && styles.financingOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.financingStatus === 'financed' && (
              <>
                <Text style={styles.label}>Finance Provider</Text>
                <View style={styles.financingOptionsContainer}>
                  {financeProviderTypes.map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.financingOption,
                        formData.financeProviderType === option.key && styles.financingOptionActive,
                      ]}
                      onPress={() => updateFormData('financeProviderType', option.key)}
                    >
                      <Text
                        style={[
                          styles.financingOptionText,
                          formData.financeProviderType === option.key && styles.financingOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {formData.financeProviderType === 'bank' && (
                  <ScrollView style={styles.typeContainer} nestedScrollEnabled>
                    {banksAndFintechs.map(bank => (
                      <TouchableOpacity
                        key={bank}
                        style={[
                          styles.typeOption,
                          formData.financeProviderName === bank && styles.typeOptionActive,
                        ]}
                        onPress={() => updateFormData('financeProviderName', bank)}
                      >
                        <Text style={styles.typeText}>{bank}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {formData.financeProviderType === 'other' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter finance provider"
                    placeholderTextColor={theme.colors.placeholder}
                    value={formData.financeProviderOther}
                    onChangeText={(value) => updateFormData('financeProviderOther', value)}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Repayment Term (e.g. 60 months)"
                  placeholderTextColor={theme.colors.placeholder}
                  value={formData.repaymentTerm}
                  onChangeText={(value) => updateFormData('repaymentTerm', value)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Paid-up Date (YYYY-MM-DD)"
                  placeholderTextColor={theme.colors.placeholder}
                  value={formData.paidUpDate}
                  onChangeText={(value) => updateFormData('paidUpDate', value)}
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Date Purchased (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.datePurchased}
              onChangeText={(value) => updateFormData('datePurchased', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.assetLocation}
              onChangeText={(value) => updateFormData('assetLocation', value)}
            />
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Review Asset</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Review your asset information</Text>

            <View style={styles.reviewContainer}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{formData.assetName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>
                  {formData.assetType === 'other'
                    ? formData.otherAssetType
                    : formData.assetType.charAt(0).toUpperCase() + formData.assetType.slice(1).replace('_', ' ')}
                </Text>
              </View>
              {formData.assetDescription && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Description:</Text>
                  <Text style={styles.reviewValue}>{formData.assetDescription}</Text>
                </View>
              )}
              {formData.assetValue && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Value:</Text>
                  <Text style={styles.reviewValue}>R {formData.assetValue}</Text>
                </View>
              )}
              {formData.assetLocation && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Location:</Text>
                  <Text style={styles.reviewValue}>{formData.assetLocation}</Text>
                </View>
              )}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Financing:</Text>
                <Text style={styles.reviewValue}>
                  {formData.financingStatus === 'financed' ? 'Financed' : 'Owned outright'}
                </Text>
              </View>
              {formData.financingStatus === 'financed' && (
                <>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Provider:</Text>
                    <Text style={styles.reviewValue}>
                      {formData.financeProviderType === 'bank'
                        ? formData.financeProviderName
                        : formData.financeProviderOther}
                    </Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Repayment Term:</Text>
                    <Text style={styles.reviewValue}>{formData.repaymentTerm}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Paid-up Date:</Text>
                    <Text style={styles.reviewValue}>{formData.paidUpDate}</Text>
                  </View>
                </>
              )}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Date Purchased:</Text>
                <Text style={styles.reviewValue}>{formData.datePurchased}</Text>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Asset</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}

          <View style={styles.buttonContainer}>
            {currentStep === totalSteps - 1 ? (
              <>
                <TouchableOpacity
                  style={[styles.secondaryButton, saving && styles.secondaryButtonDisabled]}
                  onPress={handleLinkBeneficiaryRequest}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      saving && styles.secondaryButtonTextDisabled,
                    ]}
                  >
                    Link Beneficiary
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => handleSaveAsset()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.colors.buttonText} />
                  ) : (
                    <Text style={styles.nextButtonText}>Save Asset</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={previousStep}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                  <Text style={styles.nextButtonText}>Continue</Text>
                </TouchableOpacity>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backButton} onPress={previousStep}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />

      <Modal
        animationType="fade"
        transparent
        visible={infoModalVisible}
        onRequestClose={closeAssetInfo}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="information-circle-outline" size={28} color={theme.colors.primary} />
              <Text style={styles.infoModalTitle}>{infoModalContent?.title}</Text>
            </View>
            <Text style={styles.infoModalSubtitle}>{infoModalContent?.subtitle}</Text>
            <TouchableOpacity style={styles.infoModalButton} onPress={closeAssetInfo}>
              <Text style={styles.infoModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={showPolicyRedirectModal}
        onRequestClose={() => setShowPolicyRedirectModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.policyModalContainer}>
            <Ionicons name="shield-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.policyModalTitle}>Manage Policies Separately</Text>
            <Text style={styles.policyModalBody}>
              Policies have their own guided flow so we can capture insurer details, policy numbers, and beneficiary links correctly.
              We’ll take you to the policy page now. You can return to add more assets afterwards.
            </Text>
            <View style={styles.policyModalButtons}>
              <TouchableOpacity
                style={styles.policyModalPrimary}
                onPress={() => {
                  setShowPolicyRedirectModal(false);
                  navigation.navigate('AddPolicy', {
                    showFirstTimeExplainer: route?.params?.fromGuidedWill ?? false,
                    fromGuidedWill: route?.params?.fromGuidedWill ?? false,
                  });
                }}
              >
                <Text style={styles.policyModalPrimaryText}>Go to Policy Page</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.policyModalSecondary}
                onPress={() => setShowPolicyRedirectModal(false)}
              >
                <Text style={styles.policyModalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={showFirstTimeModal}
        onRequestClose={() => setShowFirstTimeModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.policyModalContainer}>
            <Ionicons name="bulb-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.policyModalTitle}>Start with your assets</Text>
            <Text style={styles.policyModalBody}>
              Capture each asset’s value, location, and financing so we can keep your estate plan accurate. Once saved,
              you’ll link beneficiaries right away.
            </Text>
            <TouchableOpacity
              style={styles.policyModalPrimary}
              onPress={() => setShowFirstTimeModal(false)}
            >
              <Text style={styles.policyModalPrimaryText}>Let’s do it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={showLinkExplainerModal}
        onRequestClose={() => setShowLinkExplainerModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.policyModalContainer}>
            <Ionicons name="people-circle-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.policyModalTitle}>Link a beneficiary</Text>
            <Text style={styles.policyModalBody}>
              Linking now ensures this asset is assigned to the right person in your will. You can always edit it later.
            </Text>
            <TouchableOpacity
              style={styles.policyModalPrimary}
              onPress={() => {
                setShowLinkExplainerModal(false);
                setLinkExplainerShown(true);
                handleSaveAsset('link');
              }}
            >
              <Text style={styles.policyModalPrimaryText}>Continue to Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.policyModalSecondary}
              onPress={() => setShowLinkExplainerModal(false)}
            >
              <Text style={styles.policyModalSecondaryText}>Not now</Text>
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
  stepTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
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
  label: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeContainer: {
    maxHeight: 200,
    marginBottom: theme.spacing.md,
  },
  typeOption: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  typeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  typeText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  financingOptionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  financingOption: {
    flexGrow: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  financingOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  financingOptionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium as any,
    textAlign: 'center',
  },
  financingOptionTextActive: {
    color: theme.colors.primary,
  },
  reviewContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  reviewRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  reviewLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    width: 100,
  },
  reviewValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    flex: 1,
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
  nextButtonFull: {
    width: '100%',
  },
  nextButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
  secondaryButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.xs,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  infoModalContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoModalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
    marginBottom: theme.spacing.xl,
  },
  infoModalButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
  },
  infoModalButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.semibold as any,
  },
  policyModalContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  policyModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
  },
  policyModalBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  policyModalButtons: {
    width: '100%',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  policyModalSecondary: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  policyModalSecondaryText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
  },
  policyModalPrimary: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  policyModalPrimaryText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.semibold as any,
  },
});

export default AddAssetScreen;

