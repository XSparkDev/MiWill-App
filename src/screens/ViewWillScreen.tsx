import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/userService';
import ExecutorService from '../services/executorService';
import BeneficiaryService from '../services/beneficiaryService';
import AssetService from '../services/assetService';
import PolicyService from '../services/policyService';
import WillService from '../services/willService';
import { generateWillHTML, saveWillHTML } from '../utils/willGenerator';
import { UserProfile } from '../types/user';
import { ExecutorInformation } from '../types/executor';
import { BeneficiaryInformation } from '../types/beneficiary';
import { formatSAPhoneNumber } from '../utils/phoneFormatter';
import { shouldShowModal, setDontShowAgain } from '../utils/modalPreferences';

interface ViewWillScreenProps {
  navigation: any;
}

const ViewWillScreen: React.FC<ViewWillScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [willHTML, setWillHTML] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [executor, setExecutor] = useState<ExecutorInformation | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryInformation[]>([]);
  
  // Editing states
  const [editingBeneficiary, setEditingBeneficiary] = useState<BeneficiaryInformation | null>(null);
  const [showAddExecutorModal, setShowAddExecutorModal] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingWill, setSavingWill] = useState(false);
  const [showGuidedModal, setShowGuidedModal] = useState(false);
  const [dontShowGuidedAgain, setDontShowGuidedAgain] = useState(false);

  // Form states
  const [executorForm, setExecutorForm] = useState({
    executor_first_name: '',
    executor_surname: '',
    executor_email: '',
    executor_phone: '',
    executor_id_number: '',
    relationship_to_user: '',
    executor_address: '',
  });

  const [beneficiaryForm, setBeneficiaryForm] = useState({
    beneficiary_first_name: '',
    beneficiary_surname: '',
    beneficiary_email: '',
    beneficiary_phone: '',
    beneficiary_address: '',
    relationship_to_user: '',
  });

  const loadWillData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch all data
      const [profile, userExecutors, userBeneficiaries, userAssets, userPolicies] = await Promise.all([
        UserService.getUserById(currentUser.uid),
        ExecutorService.getUserExecutors(currentUser.uid),
        BeneficiaryService.getUserBeneficiaries(currentUser.uid),
        AssetService.getUserAssets(currentUser.uid),
        PolicyService.getUserPolicies(currentUser.uid),
      ]);

      setUserProfile(profile);
      if (userExecutors.length > 0) {
        setExecutor(userExecutors[0]);
      }
      setBeneficiaries(userBeneficiaries);

      // Fetch asset and policy beneficiary links with percentages
      const assetLinksMap: Record<string, Record<string, number>> = {};
      const policyLinksMap: Record<string, Record<string, number>> = {};

      for (const asset of userAssets) {
        const links = await BeneficiaryService.getAssetBeneficiaryLinks(asset.asset_id);
        assetLinksMap[asset.asset_id] = links;
      }

      for (const policy of userPolicies) {
        const links = await BeneficiaryService.getPolicyBeneficiaryLinks(policy.policy_id);
        policyLinksMap[policy.policy_id] = links;
      }

      // Generate will HTML
      if (profile) {
        const html = await generateWillHTML(
          profile,
          userExecutors.length > 0 ? userExecutors[0] : null,
          userBeneficiaries,
          userAssets,
          userPolicies,
          assetLinksMap,
          policyLinksMap
        );
        setWillHTML(html);
      }
    } catch (error) {
      console.error('Error loading will data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadWillData();
    }
  }, [currentUser, loadWillData]);

  // Show guided modal every time user enters the screen
  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const shouldShow = await shouldShowModal('VIEW_WILL_GUIDED');
        if (shouldShow) {
          setShowGuidedModal(true);
        }
      } catch (error) {
        console.error('[ViewWillScreen] Error checking modal preference:', error);
        // Default to showing modal on error
        setShowGuidedModal(true);
      }
    };
    
    // Check immediately on mount
    checkAndShowModal();
    
    // Also check on focus (when navigating back to this screen)
    const unsubscribe = navigation.addListener('focus', () => {
      checkAndShowModal();
    });
    
    return unsubscribe;
  }, [navigation]);

  const handleSaveWill = async () => {
    if (!currentUser || !willHTML) {
      Alert.alert('Error', 'No will content to save');
      return;
    }

    try {
      setSavingWill(true);
      
      // Save will HTML to file
      const willFileUri = await saveWillHTML(willHTML);

      // Check if a digital will already exists
      const userWills = await WillService.getUserWills(currentUser.uid);
      const digitalWill = userWills.find(will => 
        will.will_type === 'document' && 
        will.will_document_name?.includes('Digital Will')
      );

      if (digitalWill) {
        // Update existing will
        await WillService.updateWill(digitalWill.will_id, {
          document_path: willFileUri,
          last_updated: new Date(),
        });
      } else {
        // Create new will
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'document',
          document_path: willFileUri,
          will_document_name: 'MiWill Digital Will',
          will_title: 'MiWill Digital Will',
          status: 'active',
          is_verified: false,
          is_primary_will: true,
          last_updated: new Date(),
        });
      }
      
      // Navigate to Dashboard after successful save
      setTimeout(() => {
        navigation.navigate('Dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Error saving will:', error);
      Alert.alert('Error', error.message || 'Failed to save will');
    } finally {
      setSavingWill(false);
    }
  };

  const regenerateWill = async () => {
    if (!currentUser || !userProfile) return;

    try {
      // Fetch latest data
      const [userExecutors, userBeneficiaries, userAssets, userPolicies] = await Promise.all([
        ExecutorService.getUserExecutors(currentUser.uid),
        BeneficiaryService.getUserBeneficiaries(currentUser.uid),
        AssetService.getUserAssets(currentUser.uid),
        PolicyService.getUserPolicies(currentUser.uid),
      ]);

      // Fetch links
      const regeneratedAssetLinks: Record<string, Record<string, number>> = {};
      const regeneratedPolicyLinks: Record<string, Record<string, number>> = {};

      for (const asset of userAssets) {
        const links = await BeneficiaryService.getAssetBeneficiaryLinks(asset.asset_id);
        regeneratedAssetLinks[asset.asset_id] = links;
      }

      for (const policy of userPolicies) {
        const links = await BeneficiaryService.getPolicyBeneficiaryLinks(policy.policy_id);
        regeneratedPolicyLinks[policy.policy_id] = links;
      }

      // Generate new will HTML
      const html = await generateWillHTML(
        userProfile,
        userExecutors.length > 0 ? userExecutors[0] : null,
        userBeneficiaries,
        userAssets,
        userPolicies,
        regeneratedAssetLinks,
        regeneratedPolicyLinks
      );
      setWillHTML(html);

      // Update saved will
      const userWills = await WillService.getUserWills(currentUser.uid);
      const digitalWill = userWills.find(will => 
        will.will_type === 'document' && 
        will.will_document_name?.includes('Digital Will')
      );

      if (digitalWill) {
        const willFileUri = await saveWillHTML(html);
        await WillService.updateWill(digitalWill.will_id, {
          document_path: willFileUri,
          last_updated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error regenerating will:', error);
    }
  };

  const handleEditBeneficiary = (beneficiary: BeneficiaryInformation) => {
    setEditingBeneficiary(beneficiary);
    setBeneficiaryForm({
      beneficiary_first_name: beneficiary.beneficiary_first_name || '',
      beneficiary_surname: beneficiary.beneficiary_surname || '',
      beneficiary_email: beneficiary.beneficiary_email || '',
      beneficiary_phone: beneficiary.beneficiary_phone || '',
      beneficiary_address: beneficiary.beneficiary_address || '',
      relationship_to_user: beneficiary.relationship_to_user || '',
    });
  };

  const handleSaveBeneficiary = async () => {
    if (!currentUser || !editingBeneficiary) return;

    try {
      setSaving(true);
      const formattedPhone = beneficiaryForm.beneficiary_phone
        ? formatSAPhoneNumber(beneficiaryForm.beneficiary_phone)
        : undefined;

      await BeneficiaryService.updateBeneficiary(editingBeneficiary.beneficiary_id, {
        beneficiary_first_name: beneficiaryForm.beneficiary_first_name,
        beneficiary_surname: beneficiaryForm.beneficiary_surname,
        beneficiary_name: `${beneficiaryForm.beneficiary_first_name} ${beneficiaryForm.beneficiary_surname}`.trim(),
        beneficiary_email: beneficiaryForm.beneficiary_email || undefined,
        beneficiary_phone: formattedPhone,
        beneficiary_address: beneficiaryForm.beneficiary_address || undefined,
        relationship_to_user: beneficiaryForm.relationship_to_user,
      });

      setEditingBeneficiary(null);
      await loadWillData();
      await regenerateWill();
      Alert.alert('Success', 'Beneficiary updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update beneficiary');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExecutor = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const formattedPhone = executorForm.executor_phone
        ? formatSAPhoneNumber(executorForm.executor_phone)
        : '';

      await ExecutorService.createExecutor({
        user_id: currentUser.uid,
        executor_first_name: executorForm.executor_first_name,
        executor_surname: executorForm.executor_surname,
        executor_name: `${executorForm.executor_first_name} ${executorForm.executor_surname}`.trim(),
        executor_email: executorForm.executor_email,
        executor_phone: formattedPhone,
        executor_id_number: executorForm.executor_id_number,
        relationship_to_user: executorForm.relationship_to_user,
        executor_address: executorForm.executor_address || undefined,
        is_primary: true,
        verification_status: 'pending',
      });

      setShowAddExecutorModal(false);
      setExecutorForm({
        executor_first_name: '',
        executor_surname: '',
        executor_email: '',
        executor_phone: '',
        executor_id_number: '',
        relationship_to_user: '',
        executor_address: '',
      });
      await loadWillData();
      await regenerateWill();
      Alert.alert('Success', 'Executor added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add executor');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBeneficiary = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const formattedPhone = beneficiaryForm.beneficiary_phone
        ? formatSAPhoneNumber(beneficiaryForm.beneficiary_phone)
        : undefined;

      await BeneficiaryService.createBeneficiary({
        user_id: currentUser.uid,
        beneficiary_first_name: beneficiaryForm.beneficiary_first_name,
        beneficiary_surname: beneficiaryForm.beneficiary_surname,
        beneficiary_name: `${beneficiaryForm.beneficiary_first_name} ${beneficiaryForm.beneficiary_surname}`.trim(),
        beneficiary_email: beneficiaryForm.beneficiary_email || undefined,
        beneficiary_phone: formattedPhone,
        beneficiary_address: beneficiaryForm.beneficiary_address || undefined,
        relationship_to_user: beneficiaryForm.relationship_to_user,
        is_primary: false,
        is_verified: false,
        verification_token: '',
      });

      setShowAddBeneficiaryModal(false);
      setBeneficiaryForm({
        beneficiary_first_name: '',
        beneficiary_surname: '',
        beneficiary_email: '',
        beneficiary_phone: '',
        beneficiary_address: '',
        relationship_to_user: '',
      });
      await loadWillData();
      await regenerateWill();
      Alert.alert('Success', 'Beneficiary added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add beneficiary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your Will...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Will</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleSaveWill}
            disabled={savingWill || !willHTML}
            style={styles.saveButton}
          >
            {savingWill ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="save-outline" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddBeneficiary')}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {!executor && (
        <View style={styles.missingInfoBanner}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />
          <Text style={styles.missingInfoText}>No executor appointed</Text>
          <TouchableOpacity onPress={() => setShowAddExecutorModal(true)}>
            <Text style={styles.missingInfoButton}>Add Executor</Text>
          </TouchableOpacity>
        </View>
      )}

      {beneficiaries.length === 0 && (
        <View style={styles.missingInfoBanner}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.warning} />
          <Text style={styles.missingInfoText}>No beneficiaries appointed</Text>
          <TouchableOpacity onPress={() => setShowAddBeneficiaryModal(true)}>
            <Text style={styles.missingInfoButton}>Add Beneficiary</Text>
          </TouchableOpacity>
        </View>
      )}

      {willHTML && (
        <WebView
          originWhitelist={['*']}
          source={{ html: willHTML }}
          style={styles.webView}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          onMessage={(event) => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'editBeneficiary') {
              const beneficiary = beneficiaries.find(b => b.beneficiary_id === data.beneficiaryId);
              if (beneficiary) {
                handleEditBeneficiary(beneficiary);
              }
            } else if (data.type === 'addExecutor') {
              setShowAddExecutorModal(true);
            } else if (data.type === 'addBeneficiary') {
              setShowAddBeneficiaryModal(true);
            }
          }}
          injectedJavaScript={(() => {
            const beneficiariesData = beneficiaries.map(b => ({
              id: b.beneficiary_id,
              name: b.beneficiary_name || `${b.beneficiary_first_name || ''} ${b.beneficiary_surname || ''}`.trim()
            }));
            return `
              (function() {
                const beneficiaries = ${JSON.stringify(beneficiariesData)};
                const primaryColor = '${theme.colors.primary}';
                const warningColor = '${theme.colors.warning}';
                
                beneficiaries.forEach(function(ben) {
                  const elements = document.querySelectorAll('*');
                  elements.forEach(function(el) {
                    if (el.textContent && el.textContent.includes(ben.name) && !el.hasAttribute('data-clickable')) {
                      el.style.cursor = 'pointer';
                      el.style.color = primaryColor;
                      el.setAttribute('data-clickable', 'true');
                      el.setAttribute('data-beneficiary-id', ben.id);
                      el.addEventListener('click', function() {
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'editBeneficiary',
                            beneficiaryId: ben.id
                          }));
                        }
                      });
                    }
                  });
                });
                
                const executorElements = document.querySelectorAll('.executor-info .blank-line');
                executorElements.forEach(function(el) {
                  if (el.textContent && el.textContent.includes('MiWill Executor Services')) {
                    el.style.cursor = 'pointer';
                    el.style.color = warningColor;
                    el.setAttribute('data-clickable', 'true');
                    el.addEventListener('click', function() {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'addExecutor'
                        }));
                      }
                    });
                  }
                });
                
                const allElements = document.querySelectorAll('*');
                allElements.forEach(function(el) {
                  if (el.textContent && el.textContent.includes('No beneficiaries have been appointed yet')) {
                    el.style.cursor = 'pointer';
                    el.style.color = warningColor;
                    el.setAttribute('data-clickable', 'true');
                    el.addEventListener('click', function() {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'addBeneficiary'
                        }));
                      }
                    });
                  }
                });
                
                true;
              })();
            `;
          })()}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading your Will...</Text>
            </View>
          )}
        />
      )}

      {/* Edit Beneficiary Modal */}
      <Modal
        visible={!!editingBeneficiary}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingBeneficiary(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Beneficiary</Text>
              <TouchableOpacity onPress={() => setEditingBeneficiary(null)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_first_name}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_first_name: text })}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_surname}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_surname: text })}
                  placeholder="Surname"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_email}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_phone}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_phone: text })}
                  placeholder="+27 82 123 4567"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_address}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_address: text })}
                  placeholder="Address"
                  multiline
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.relationship_to_user}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, relationship_to_user: text })}
                  placeholder="Relationship"
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditingBeneficiary(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveBeneficiary}
                disabled={saving || !beneficiaryForm.beneficiary_first_name || !beneficiaryForm.beneficiary_surname}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.buttonText} />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Executor Modal */}
      <Modal
        visible={showAddExecutorModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddExecutorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Executor</Text>
              <TouchableOpacity onPress={() => setShowAddExecutorModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_first_name}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_first_name: text })}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_surname}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_surname: text })}
                  placeholder="Surname"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID Number *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_id_number}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_id_number: text })}
                  placeholder="ID Number"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_email}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_phone}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_phone: text })}
                  placeholder="+27 82 123 4567"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.relationship_to_user}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, relationship_to_user: text })}
                  placeholder="Relationship"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={executorForm.executor_address}
                  onChangeText={(text) => setExecutorForm({ ...executorForm, executor_address: text })}
                  placeholder="Address"
                  multiline
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddExecutorModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddExecutor}
                disabled={saving || !executorForm.executor_first_name || !executorForm.executor_surname || !executorForm.executor_id_number || !executorForm.executor_email || !executorForm.executor_phone}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.buttonText} />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Add Executor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Beneficiary Modal */}
      <Modal
        visible={showAddBeneficiaryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddBeneficiaryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Beneficiary</Text>
              <TouchableOpacity onPress={() => setShowAddBeneficiaryModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_first_name}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_first_name: text })}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_surname}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_surname: text })}
                  placeholder="Surname"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_email}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_phone}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_phone: text })}
                  placeholder="+27 82 123 4567"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_address}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, beneficiary_address: text })}
                  placeholder="Address"
                  multiline
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.relationship_to_user}
                  onChangeText={(text) => setBeneficiaryForm({ ...beneficiaryForm, relationship_to_user: text })}
                  placeholder="Relationship"
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddBeneficiaryModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddBeneficiary}
                disabled={saving || !beneficiaryForm.beneficiary_first_name || !beneficiaryForm.beneficiary_surname}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.buttonText} />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Add Beneficiary</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guided Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showGuidedModal}
        onRequestClose={() => setShowGuidedModal(false)}
      >
        <View style={styles.guidedModalOverlay}>
          <View style={styles.guidedModalContainer}>
            <Ionicons name="bulb-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.guidedModalStartTitle}>Start</Text>
            <Text style={styles.guidedModalTitle}>Your Digital Will</Text>
            <Text style={styles.guidedModalBody}>
              View and edit your Will directly. Click on beneficiary names to edit their details, use the floating buttons to add new beneficiaries or executors, and save your changes when you're done.
            </Text>
            <TouchableOpacity
              style={styles.guidedModalPrimary}
              onPress={async () => {
                if (dontShowGuidedAgain) {
                  await setDontShowAgain('VIEW_WILL_GUIDED');
                }
                setShowGuidedModal(false);
              }}
            >
              <Text style={styles.guidedModalPrimaryText}>Got it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guidedModalCheckboxContainer}
              onPress={() => setDontShowGuidedAgain(!dontShowGuidedAgain)}
            >
              <View style={[styles.guidedModalCheckbox, dontShowGuidedAgain && styles.guidedModalCheckboxChecked]}>
                {dontShowGuidedAgain && <Text style={styles.guidedModalCheckmark}>✓</Text>}
              </View>
              <Text style={styles.guidedModalCheckboxText}>Don't show again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabMain]}
          onPress={() => setShowAddBeneficiaryModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.colors.buttonText} />
        </TouchableOpacity>
        {beneficiaries.length > 0 && (
          <View style={styles.fabMenu}>
            {beneficiaries.map((beneficiary, index) => (
              <TouchableOpacity
                key={beneficiary.beneficiary_id}
                style={[styles.fab, styles.fabSmall]}
                onPress={() => handleEditBeneficiary(beneficiary)}
              >
                <Text style={styles.fabLabel}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!executor && (
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => setShowAddExecutorModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color={theme.colors.buttonText} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  saveButton: {
    padding: theme.spacing.xs,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  missingInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  missingInfoText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  missingInfoButton: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '90%',
    paddingTop: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonTextPrimary: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  modalButtonTextSecondary: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabMain: {
    width: 56,
    height: 56,
  },
  fabSecondary: {
    width: 48,
    height: 48,
  },
  fabSmall: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.secondary,
  },
  fabMenu: {
    gap: theme.spacing.xs,
    alignItems: 'flex-end',
  },
  fabLabel: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold as any,
  },
  guidedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  guidedModalContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  guidedModalStartTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: -theme.spacing.sm,
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
  guidedModalPrimary: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  guidedModalPrimaryText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.semibold as any,
  },
  guidedModalCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  guidedModalCheckbox: {
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
  guidedModalCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  guidedModalCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold' as any,
  },
  guidedModalCheckboxText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
});

export default ViewWillScreen;
