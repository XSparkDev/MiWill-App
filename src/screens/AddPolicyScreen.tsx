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
import PolicyService from '../services/policyService';
import Toast from '../components/Toast';
import { formatCurrencyInput, parseCurrency } from '../utils/currencyFormatter';
import { shouldShowModal, setDontShowAgain } from '../utils/modalPreferences';

const { width } = Dimensions.get('window');

interface AddPolicyScreenProps {
  navigation: any;
  route?: any;
}

const policyTypes = ['retirement_annuity', 'life_insurance', 'other'];

const policyTypeDescriptions: Record<string, { title: string; subtitle: string }> = {
  life_insurance: {
    title: 'Life Insurance Policy Guide',
    subtitle:
      'Life cover pays out a lump sum to beneficiaries when the policyholder passes away. Capture policy number, insurer, and nominated beneficiaries. Confirm whether any binding beneficiary nominations already exist with the insurer.',
  },
  retirement_annuity: {
    title: 'Retirement Annuity Guide',
    subtitle:
      'Capture fund administrator, policy number, and any annuitant notes. Confirm beneficiary nominations with your provider to ensure payouts align with your estate plan.',
  },
  other: {
    title: 'Other Policy Guide',
    subtitle:
      'Use this category for policies not listed above. Provide as much detail as possible so beneficiaries understand cover limits, waiting periods, and any documentation required for claims.',
  },
};

const getPolicyDisclaimer = () =>
  'Read more about policy, please consult an attorney for further information';

const AddPolicyScreen: React.FC<AddPolicyScreenProps> = ({ navigation, route }) => {
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
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [dontShowFirstTimeAgain, setDontShowFirstTimeAgain] = useState(false);
  const [showLinkExplainerModal, setShowLinkExplainerModal] = useState(false);
  const [dontShowLinkExplainerAgain, setDontShowLinkExplainerAgain] = useState(false);
  const [linkExplainerShown, setLinkExplainerShown] = useState(false);

  const [formData, setFormData] = useState({
    policyNumber: '',
    policyType: '',
    otherPolicyType: '',
    insuranceCompany: '',
    policyValue: '',
    policyDescription: '',
  });

  const totalSteps = 3;
  const fromGuidedWill = route?.params?.fromGuidedWill ?? false;

  // Show modal every time user enters the screen
  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const shouldShow = await shouldShowModal('ADD_POLICY_FIRST_TIME');
        console.log('[AddPolicyScreen] Should show first time modal:', shouldShow);
        if (shouldShow) {
          setShowFirstTimeModal(true);
        }
      } catch (error) {
        console.error('[AddPolicyScreen] Error checking modal preference:', error);
        // Default to showing modal on error
        setShowFirstTimeModal(true);
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

  const updateFormData = (field: string, value: string) => {
    if (field === 'policyValue') {
      setFormData(prev => ({ ...prev, [field]: formatCurrencyInput(value) }));
      return;
    }
    setFormData(prev => {
      if (field === 'policyType') {
        return {
          ...prev,
          policyType: value,
          otherPolicyType: value === 'other' ? prev.otherPolicyType : '',
        };
      }
      return { ...prev, [field]: value };
    });
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

  const handleLinkBeneficiaryRequest = async () => {
    if (fromGuidedWill && !linkExplainerShown) {
      const shouldShow = await shouldShowModal('ADD_POLICY_LINK_BENEFICIARY');
      if (shouldShow) {
        setShowLinkExplainerModal(true);
      } else {
        setLinkExplainerShown(true);
        handleSavePolicy('link');
      }
    } else {
      handleSavePolicy('link');
    }
  };

  const nextStep = async () => {
    if (currentStep < totalSteps - 1) {
      // Validate required fields before proceeding
      if (currentStep === 0) {
        if (!formData.policyType) {
          setToastMessage('Please select a policy type');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (!formData.insuranceCompany.trim()) {
          setToastMessage('Please enter an Insurer');
          setToastType('error');
          setShowToast(true);
          return;
        }
        if (formData.policyType === 'other' && !formData.otherPolicyType.trim()) {
          setToastMessage('Please specify your policy type');
          setToastType('error');
          setShowToast(true);
          return;
        }
      } else if (currentStep === 1) {
        if (!formData.policyValue.trim()) {
          setToastMessage('Please enter a policy value');
          setToastType('error');
          setShowToast(true);
          return;
        }
        setFormData(prev => ({
          ...prev,
          policyValue: formatCurrencyInput(prev.policyValue),
        }));
        if (!formData.policyDescription.trim()) {
          setToastMessage('Please enter a policy description');
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

  const handleSavePolicy = async (nextAction: 'back' | 'link' | 'addMore' = 'back') => {
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
        policy_type:
          formData.policyType === 'other'
            ? formData.otherPolicyType.trim()
            : (formData.policyType as any),
        insurance_company: formData.insuranceCompany.trim(),
        policy_value: parseCurrency(formData.policyValue),
        policy_description: formData.policyDescription.trim(),
        is_active: true,
      });

      setToastMessage('Policy added successfully!');
      setToastType('success');
      setShowToast(true);

      if (nextAction === 'link') {
        navigation.navigate('AddBeneficiary', {
          fromGuidedFlow: fromGuidedWill,
          returnTo: fromGuidedWill ? 'Dashboard' : undefined,
        });
      } else if (nextAction === 'addMore') {
        // Reset form and go back to step 0
        setFormData({
          policyNumber: '',
          policyType: '',
          otherPolicyType: '',
          insuranceCompany: '',
          policyValue: '',
          policyDescription: '',
        });
        setCurrentStep(0);
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
        setSaving(false);
      } else {
        setTimeout(() => {
          navigation.navigate('Dashboard');
        }, 1500);
      }
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
              placeholder="Insurer"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.insuranceCompany}
              onChangeText={(value) => updateFormData('insuranceCompany', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Policy Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyNumber}
              onChangeText={(value) => updateFormData('policyNumber', value)}
            />
            <Text style={styles.optionalNote}>
              You can add your policy number later from the dashboard.
            </Text>

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

            {formData.policyType === 'other' && (
              <TextInput
                style={styles.input}
                placeholder="Specify policy type"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.otherPolicyType}
                onChangeText={(value) => updateFormData('otherPolicyType', value)}
              />
            )}

            {formData.policyType ? (
              <TouchableOpacity style={styles.disclaimerBox} onPress={() => openPolicyInfo(formData.policyType)}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.disclaimerText}>{getPolicyDisclaimer()}</Text>
              </TouchableOpacity>
            ) : null}
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
              placeholder="Policy Value"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyValue}
              onChangeText={(value) => updateFormData('policyValue', value)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
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
                <Text style={styles.reviewValue}>
                  {formData.policyNumber.trim() || 'Add later'}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>
                  {formData.policyType === 'other'
                    ? formData.otherPolicyType
                    : formData.policyType.charAt(0).toUpperCase() + formData.policyType.slice(1).replace('_', ' ')}
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
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Policy</Text>
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
                  onPress={() => handleSavePolicy()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.colors.buttonText} />
                  ) : (
                    <Text style={styles.nextButtonText}>Save Policy</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addMoreButton, saving && styles.addMoreButtonDisabled]}
                  onPress={async () => {
                    await handleSavePolicy('addMore');
                  }}
                  disabled={saving}
                >
                  <Text style={styles.addMoreButtonText}>Add more policies</Text>
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

      <Modal
        animationType="fade"
        transparent
        visible={showFirstTimeModal}
        onRequestClose={() => setShowFirstTimeModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.policyModalContainer}>
            <Ionicons name="bulb-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.policyModalStartTitle}>Start</Text>
            <Text style={styles.policyModalTitle}>Add Your Policies</Text>
            <Text style={styles.policyModalBody}>
              Capture the policy number, insurer, and value so we can link beneficiaries immediately after saving.
            </Text>
            <TouchableOpacity
              style={styles.policyModalPrimary}
              onPress={async () => {
                if (dontShowFirstTimeAgain) {
                  await setDontShowAgain('ADD_POLICY_FIRST_TIME');
                }
                setShowFirstTimeModal(false);
              }}
            >
              <Text style={styles.policyModalPrimaryText}>Let's do it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCheckboxContainer}
              onPress={() => setDontShowFirstTimeAgain(!dontShowFirstTimeAgain)}
            >
              <View style={[styles.modalCheckbox, dontShowFirstTimeAgain && styles.modalCheckboxChecked]}>
                {dontShowFirstTimeAgain && <Text style={styles.modalCheckmark}>✓</Text>}
              </View>
              <Text style={styles.modalCheckboxText}>Don't show again</Text>
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
          <View style={styles.infoModalContainer}>
            <Ionicons name="people-circle-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.infoModalTitle}>Link a beneficiary</Text>
            <Text style={styles.infoModalSubtitle}>
              Linking now ensures this policy payout reaches the right person. You can adjust beneficiaries later if anything changes.
            </Text>
            <TouchableOpacity
              style={styles.modalCheckboxContainer}
              onPress={() => setDontShowLinkExplainerAgain(!dontShowLinkExplainerAgain)}
            >
              <View style={[styles.modalCheckbox, dontShowLinkExplainerAgain && styles.modalCheckboxChecked]}>
                {dontShowLinkExplainerAgain && <Text style={styles.modalCheckmark}>✓</Text>}
              </View>
              <Text style={styles.modalCheckboxText}>Don't show again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={async () => {
                if (dontShowLinkExplainerAgain) {
                  await setDontShowAgain('ADD_POLICY_LINK_BENEFICIARY');
                }
                setShowLinkExplainerModal(false);
                setLinkExplainerShown(true);
                handleSavePolicy('link');
              }}
            >
              <Text style={styles.modalCloseText}>Continue to Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setShowLinkExplainerModal(false)}
            >
              <Text style={styles.modalBackText}>Maybe later</Text>
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
  optionalNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: -theme.spacing.xs / 2,
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
  addMoreButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  addMoreButtonDisabled: {
    opacity: 0.5,
  },
  addMoreButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
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
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    marginTop: theme.spacing.md,
  },
  modalCloseText: {
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
  modalBackButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  modalBackText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
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
  policyModalStartTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
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

export default AddPolicyScreen;

