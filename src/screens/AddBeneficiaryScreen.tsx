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

const { width } = Dimensions.get('window');

interface AddBeneficiaryScreenProps {
  navigation: any;
}

const AddBeneficiaryScreen: React.FC<AddBeneficiaryScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const totalSteps = 4;

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
      } catch (error: any) {
        console.error('[AddBeneficiaryScreen] Error fetching data:', error);
        setToast({ message: 'Failed to load assets and policies', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const nextStep = () => {
    // Validation on step 0
    if (currentStep === 0) {
      if (!formData.beneficiaryName.trim()) {
        setToast({ message: 'Please enter beneficiary name', type: 'error' });
        return;
      }
      if (!formData.relationshipToUser.trim()) {
        setToast({ message: 'Please enter relationship to beneficiary', type: 'error' });
        return;
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
      return;
    }

    try {
      setSaving(true);

      // 1. Create beneficiary
      const beneficiaryId = await BeneficiaryService.createBeneficiary({
        user_id: currentUser.uid,
        beneficiary_name: formData.beneficiaryName.trim(),
        beneficiary_email: formData.beneficiaryEmail.trim() || undefined,
        beneficiary_phone: formData.beneficiaryPhone.trim() || undefined,
        beneficiary_address: formData.beneficiaryAddress.trim() || undefined,
        relationship_to_user: formData.relationshipToUser.trim(),
        is_primary: false,
        is_verified: false,
        verification_token: '',
      });

      // 2. Link assets to beneficiary
      const assetLinkPromises = formData.selectedAssets.map((assetId) =>
        BeneficiaryService.linkAssetToBeneficiary(
          assetId,
          beneficiaryId,
          100, // Default percentage - can be customized later
          'equal_split'
        )
      );

      // 3. Link policies to beneficiary
      const policyLinkPromises = formData.selectedPolicies.map((policyId) =>
        BeneficiaryService.linkPolicyToBeneficiary(
          policyId,
          beneficiaryId,
          100, // Default percentage - can be customized later
          'equal_split'
        )
      );

      await Promise.all([...assetLinkPromises, ...policyLinkPromises]);

      setToast({ message: 'Beneficiary added successfully!', type: 'success' });
      
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
              placeholder="Beneficiary Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryName}
              onChangeText={(value) => updateFormData('beneficiaryName', value)}
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
              placeholder="Email (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryEmail}
              onChangeText={(value) => updateFormData('beneficiaryEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryPhone}
              onChangeText={(value) => updateFormData('beneficiaryPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Address (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.beneficiaryAddress}
              onChangeText={(value) => updateFormData('beneficiaryAddress', value)}
              multiline
            />
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Link Assets</Text>
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
                  <TouchableOpacity
                    key={asset.asset_id}
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
                ))}
              </ScrollView>
            )}
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Link Policies</Text>
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
                  <TouchableOpacity
                    key={policy.policy_id}
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
                <Text style={styles.reviewItem}>Name: {formData.beneficiaryName}</Text>
                <Text style={styles.reviewItem}>Relationship: {formData.relationshipToUser}</Text>
                {formData.beneficiaryEmail && (
                  <Text style={styles.reviewItem}>Email: {formData.beneficiaryEmail}</Text>
                )}
                {formData.beneficiaryPhone && (
                  <Text style={styles.reviewItem}>Phone: {formData.beneficiaryPhone}</Text>
                )}
              </View>

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
            {currentStep > 0 && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={previousStep}
                disabled={saving}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton, 
                currentStep === 0 && styles.nextButtonFull,
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  selectionContainer: {
    maxHeight: 300,
  },
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
});

export default AddBeneficiaryScreen;

