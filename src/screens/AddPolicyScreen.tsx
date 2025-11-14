import React, { useState, useRef } from 'react';
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
import PolicyService from '../services/policyService';
import Toast from '../components/Toast';
import { formatCurrencyInput, parseCurrency } from '../utils/currencyFormatter';

const { width } = Dimensions.get('window');

interface AddPolicyScreenProps {
  navigation: any;
}

const policyTypes = [
  'life_insurance',
  'health_insurance',
  'property_insurance',
  'vehicle_insurance',
  'other',
];

const policyTypeDescriptions: Record<string, { title: string; subtitle: string }> = {
  life_insurance: {
    title: 'Life Insurance Policy Guide',
    subtitle:
      'Life cover pays out a lump sum to beneficiaries when the policyholder passes away. Capture policy number, insurer, and nominated beneficiaries. Confirm whether any binding beneficiary nominations already exist with the insurer.',
  },
  health_insurance: {
    title: 'Health Insurance Policy Guide',
    subtitle:
      'Comprehensive or gap cover policies may provide additional medical benefits. Document waiting periods, dependants, and benefits. Speak to an attorney or broker regarding transfer or continuation rules.',
  },
  property_insurance: {
    title: 'Property Insurance Guide',
    subtitle:
      'Homeowner’s policies protect buildings against damage or loss. Record insurer, cover limits, and any bond-holder requirements. Ensure executor or beneficiary knows to update ownership after transfer.',
  },
  vehicle_insurance: {
    title: 'Vehicle Insurance Guide',
    subtitle:
      'Vehicle cover includes comprehensive, third-party, fire, and theft policies. Note premium status, nominated drivers, and claims history. Executors must arrange cancellation or transfer when ownership changes.',
  },
  other: {
    title: 'Other Policy Guide',
    subtitle:
      'Use this category for policies not listed above. Provide as much detail as possible so beneficiaries understand cover limits, waiting periods, and any documentation required for claims.',
  },
};

const getPolicyDisclaimer = () =>
  'Read more about policy, please consult an attorney for further information';

const AddPolicyScreen: React.FC<AddPolicyScreenProps> = ({ navigation }) => {
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

  const [formData, setFormData] = useState({
    policyNumber: '',
    policyType: '',
    insuranceCompany: '',
    policyValue: '',
    policyDescription: '',
  });

  const totalSteps = 3;

  const updateFormData = (field: string, value: string) => {
    if (field === 'policyValue') {
      setFormData(prev => ({ ...prev, [field]: formatCurrencyInput(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openPolicyInfo = (policyType: string) => {
    if (!policyType) return;
    const content = policyTypeDescriptions[policyType] ?? policyTypeDescriptions.other;
    setInfoModalContent(content);
    setInfoModalVisible(true);
  };

  const closePolicyInfo = () => {
    setInfoModalVisible(false);
    setInfoModalContent(null);
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      // Validate required fields before proceeding
      if (currentStep === 0) {
        if (!formData.policyNumber.trim()) {
          setToastMessage('Please enter a policy number');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.policyType) {
          setToastMessage('Please select a policy type');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.insuranceCompany.trim()) {
          setToastMessage('Please enter an insurance company');
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
      // Save policy to Firebase
      await handleSavePolicy();
    }
  };

  const handleSavePolicy = async () => {
    if (!currentUser) {
      setToastMessage('You must be logged in to add a policy');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      setSaving(true);

      await PolicyService.createPolicy({
        user_id: currentUser.uid,
        policy_number: formData.policyNumber.trim(),
        policy_type: formData.policyType as any,
        insurance_company: formData.insuranceCompany.trim(),
        policy_value: formData.policyValue ? parseCurrency(formData.policyValue) : undefined,
        policy_description: formData.policyDescription.trim() || undefined,
        is_active: true,
      });

      setToastMessage('Policy added successfully!');
      setToastType('success');
      setShowToast(true);

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to save policy');
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
            <Text style={styles.stepTitle}>Policy Information</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Tell us about your insurance policy</Text>

            <TextInput
              style={styles.input}
              placeholder="Policy Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyNumber}
              onChangeText={(value) => updateFormData('policyNumber', value)}
            />

            <Text style={styles.label}>Policy Type</Text>
            <ScrollView style={styles.typeContainer} nestedScrollEnabled>
              {policyTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.policyType === type && styles.typeOptionActive,
                  ]}
                  onPress={() => updateFormData('policyType', type)}
                >
                  <Text style={styles.typeText}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {formData.policyType ? (
              <TouchableOpacity style={styles.disclaimerBox} onPress={() => openPolicyInfo(formData.policyType)}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.disclaimerText}>{getPolicyDisclaimer()}</Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Insurance Company"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.insuranceCompany}
              onChangeText={(value) => updateFormData('insuranceCompany', value)}
            />
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Policy Details</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Additional information about your policy</Text>

            <TextInput
              style={styles.input}
              placeholder="Policy Value (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyValue}
              onChangeText={(value) => updateFormData('policyValue', value)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Description (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyDescription}
              onChangeText={(value) => updateFormData('policyDescription', value)}
              multiline
            />
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Review Policy</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Review your policy information</Text>

            <View style={styles.reviewContainer}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Policy Number:</Text>
                <Text style={styles.reviewValue}>{formData.policyNumber}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>
                  {formData.policyType.charAt(0).toUpperCase() + formData.policyType.slice(1).replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Company:</Text>
                <Text style={styles.reviewValue}>{formData.insuranceCompany}</Text>
              </View>
              {formData.policyValue && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Value:</Text>
                  <Text style={styles.reviewValue}>R {formData.policyValue}</Text>
                </View>
              )}
              {formData.policyDescription && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Description:</Text>
                  <Text style={styles.reviewValue}>{formData.policyDescription}</Text>
                </View>
              )}
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
          <Text style={styles.headerTitle}>Add Policy</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}

          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={previousStep}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
              onPress={nextStep}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.buttonText} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Save Policy' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
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
        onRequestClose={closePolicyInfo}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="information-circle-outline" size={28} color={theme.colors.primary} />
              <Text style={styles.infoModalTitle}>{infoModalContent?.title}</Text>
            </View>
            <Text style={styles.infoModalSubtitle}>{infoModalContent?.subtitle}</Text>
            <TouchableOpacity style={styles.infoModalButton} onPress={closePolicyInfo}>
              <Text style={styles.infoModalButtonText}>Close</Text>
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
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  disclaimerText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
    flex: 1,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.xs,
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
    width: 120,
  },
  reviewValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
    height: 56,
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
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
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
});

export default AddPolicyScreen;

