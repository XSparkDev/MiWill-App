import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import UserService, { sanitizeSouthAfricanIdNumber, isValidSouthAfricanIdNumber } from '../services/userService';
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
import { viewWillStyles as styles } from './ViewWillScreen.styles';

interface ViewWillScreenProps {
  navigation: any;
}

const formatDateInput = (value: string): string => {
  const digitsOnly = value.replace(/[^\d]/g, '').slice(0, 8);
  const parts: string[] = [];
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
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionTime, setCollectionTime] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [printContactName, setPrintContactName] = useState('');
  const [printContactEmail, setPrintContactEmail] = useState('');
  const [printCopies, setPrintCopies] = useState('');
  const [printNotes, setPrintNotes] = useState('');
  const [approvalProcessing, setApprovalProcessing] = useState(false);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('Processing...');

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
    beneficiary_id_number: '',
  });

  const estateWideBeneficiaries = beneficiaries.filter(
    (beneficiary) => beneficiary.inherit_entire_estate
  );

  useEffect(() => {
    if (userProfile?.address) {
      setCollectionAddress(prev => prev || userProfile.address || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (showCollectionModal) {
      if (userProfile?.address) {
        setCollectionAddress(userProfile.address);
      }
      if (!collectionDate) {
        setCollectionDate(formatDateInput(new Date().toISOString().slice(0, 10)));
      }
    }
  }, [showCollectionModal, userProfile, collectionDate]);

  const getLinkedBeneficiaries = (
    allBeneficiaries: BeneficiaryInformation[],
    assetLinks: Record<string, Record<string, number>>,
    policyLinks: Record<string, Record<string, number>>
  ): BeneficiaryInformation[] => {
    const linkedIds = new Set<string>();

    const collectLinkedIds = (linksMap: Record<string, Record<string, number>>) => {
      Object.values(linksMap).forEach(linkEntries => {
        Object.entries(linkEntries).forEach(([beneficiaryId, allocation]) => {
          if (typeof allocation === 'number' && allocation > 0) {
            linkedIds.add(beneficiaryId);
          }
        });
      });
    };

    collectLinkedIds(assetLinks);
    collectLinkedIds(policyLinks);

    allBeneficiaries.forEach(beneficiary => {
      if (beneficiary.inherit_entire_estate) {
        linkedIds.add(beneficiary.beneficiary_id);
      }
    });

    const filtered = allBeneficiaries.filter(ben => linkedIds.has(ben.beneficiary_id));
    return filtered.length > 0 ? filtered : allBeneficiaries;
  };

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

      const beneficiariesForWill = getLinkedBeneficiaries(userBeneficiaries, assetLinksMap, policyLinksMap);
      setBeneficiaries(beneficiariesForWill);

      // Generate will HTML
      if (profile) {
        const html = await generateWillHTML(
          profile,
          userExecutors.length > 0 ? userExecutors[0] : null,
          beneficiariesForWill,
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

  const saveWillDocument = async (): Promise<boolean> => {
    if (!currentUser || !willHTML) {
      Alert.alert('Error', 'No will content to save');
      return false;
    }

    try {
      const willFileUri = await saveWillHTML(willHTML);
      const userWills = await WillService.getUserWills(currentUser.uid);
      const digitalWill = userWills.find(will => 
        will.will_type === 'document' && 
        will.will_document_name?.includes('Digital Will')
      );

      if (digitalWill) {
        await WillService.updateWill(digitalWill.will_id, {
          document_path: willFileUri,
          last_updated: new Date(),
        });
      } else {
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

      return true;
    } catch (error: any) {
      console.error('Error saving will:', error);
      Alert.alert('Error', error.message || 'Failed to save will');
      return false;
    }
  };

  const handleSaveWill = async () => {
    try {
      setSavingWill(true);
      const success = await saveWillDocument();
      if (success) {
        setTimeout(() => {
          navigation.navigate('Dashboard');
        }, 500);
      }
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

      const beneficiariesForWill = getLinkedBeneficiaries(
        userBeneficiaries,
        regeneratedAssetLinks,
        regeneratedPolicyLinks
      );
      setBeneficiaries(beneficiariesForWill);

      // Generate new will HTML
      const html = await generateWillHTML(
        userProfile,
        userExecutors.length > 0 ? userExecutors[0] : null,
        beneficiariesForWill,
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
      beneficiary_id_number: beneficiary.beneficiary_id_number || '',
    });
  };

  const handleSaveBeneficiary = async () => {
    if (!currentUser || !editingBeneficiary) return;

    try {
      setSaving(true);
      const formattedPhone = beneficiaryForm.beneficiary_phone
        ? formatSAPhoneNumber(beneficiaryForm.beneficiary_phone)
        : undefined;
      const sanitizedIdNumber = sanitizeSouthAfricanIdNumber(
        beneficiaryForm.beneficiary_id_number || ''
      );

      if (!sanitizedIdNumber || !isValidSouthAfricanIdNumber(sanitizedIdNumber)) {
        Alert.alert('Validation', 'Please enter a valid 13-digit South African ID number.');
        setSaving(false);
        return;
      }

      await BeneficiaryService.updateBeneficiary(editingBeneficiary.beneficiary_id, {
        beneficiary_first_name: beneficiaryForm.beneficiary_first_name,
        beneficiary_surname: beneficiaryForm.beneficiary_surname,
        beneficiary_name: `${beneficiaryForm.beneficiary_first_name} ${beneficiaryForm.beneficiary_surname}`.trim(),
        beneficiary_email: beneficiaryForm.beneficiary_email || undefined,
        beneficiary_phone: formattedPhone,
        beneficiary_address: beneficiaryForm.beneficiary_address || undefined,
        relationship_to_user: beneficiaryForm.relationship_to_user,
        beneficiary_id_number: sanitizedIdNumber,
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
      const sanitizedIdNumber = sanitizeSouthAfricanIdNumber(
        beneficiaryForm.beneficiary_id_number || ''
      );

      if (!sanitizedIdNumber || !isValidSouthAfricanIdNumber(sanitizedIdNumber)) {
        Alert.alert('Validation', 'Please enter a valid 13-digit South African ID number.');
        setSaving(false);
        return;
      }

      await BeneficiaryService.createBeneficiary({
        user_id: currentUser.uid,
        beneficiary_first_name: beneficiaryForm.beneficiary_first_name,
        beneficiary_surname: beneficiaryForm.beneficiary_surname,
        beneficiary_name: `${beneficiaryForm.beneficiary_first_name} ${beneficiaryForm.beneficiary_surname}`.trim(),
        beneficiary_email: beneficiaryForm.beneficiary_email || undefined,
        beneficiary_phone: formattedPhone,
        beneficiary_address: beneficiaryForm.beneficiary_address || undefined,
        relationship_to_user: beneficiaryForm.relationship_to_user,
        beneficiary_id_number: sanitizedIdNumber,
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
        beneficiary_id_number: '',
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

  const handleFooterSave = async () => {
    setFooterSaving(true);
    const success = await saveWillDocument();
    if (success) {
      Alert.alert('Saved', 'Your Will has been saved.');
    }
    setFooterSaving(false);
  };

  const handleApprovalPress = () => {
    setApprovalModalVisible(true);
  };

  const handleApprovalPrint = async (): Promise<boolean> => {
    setApprovalProcessing(true);
    const success = await saveWillDocument();
    if (success) {
      Alert.alert('Ready to Print', 'Your Will has been saved. You can now print the document.');
      setApprovalModalVisible(false);
      setShowPrintModal(false);
    }
    setApprovalProcessing(false);
    return success;
  };

  const handlePrintSubmit = async () => {
    if (!printContactName.trim()) {
      Alert.alert('Contact Required', 'Please provide the contact name for printing.');
      return;
    }
    if (!printContactEmail.trim() || !printContactEmail.includes('@')) {
      Alert.alert('Email Required', 'Please provide a valid contact email.');
      return;
    }
    const copiesNumber = parseInt(printCopies, 10);
    if (!Number.isFinite(copiesNumber) || copiesNumber <= 0) {
      Alert.alert('Copies Required', 'Please enter a valid number of copies.');
      return;
    }

    console.log('[PrintRequest]', {
      printContactName,
      printContactEmail,
      copiesNumber,
      printNotes,
    });

    setProcessingStatusText('Preparing print-ready package...');
    setShowProcessingOverlay(true);
    const success = await handleApprovalPrint();
    if (success) {
      setProcessingStatusText('Print package ready!');
      setTimeout(() => {
        setShowProcessingOverlay(false);
        setPrintNotes('');
      }, 800);
    } else {
      setShowProcessingOverlay(false);
    }
  };

  const handleWebViewScroll = ({ nativeEvent }: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (!contentOffset || !contentSize || !layoutMeasurement) {
      return;
    }
    const reachedBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (reachedBottom && !hasReachedBottom) {
      setHasReachedBottom(true);
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
        <TouchableOpacity onPress={() => navigation.navigate('UploadWill')}>
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

      {estateWideBeneficiaries.length > 0 && (
        <View style={styles.missingInfoBanner}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.missingInfoText}>
            Default estate beneficiary: {estateWideBeneficiaries.map(ben => ben.beneficiary_name || `${ben.beneficiary_first_name || ''} ${ben.beneficiary_surname || ''}`.trim()).join(', ')}
          </Text>
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
          onScroll={handleWebViewScroll}
          scrollEventThrottle={16}
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

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.bottomButton,
            (!hasReachedBottom || footerSaving || savingWill) && styles.bottomButtonDisabled,
          ]}
          disabled={!hasReachedBottom || footerSaving || savingWill}
          onPress={handleFooterSave}
        >
          {footerSaving ? (
            <ActivityIndicator color={theme.colors.buttonText} />
          ) : (
            <Text style={styles.bottomButtonText}>Save Will</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bottomButton,
            styles.approvalButton,
            (!hasReachedBottom || approvalProcessing || savingWill) && styles.bottomButtonDisabled,
          ]}
          disabled={!hasReachedBottom || approvalProcessing || savingWill}
          onPress={handleApprovalPress}
        >
          {approvalProcessing ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.approvalButtonText}>Approve & Continue</Text>
          )}
        </TouchableOpacity>
      </View>

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
                <Text style={styles.label}>ID Number *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_id_number}
                  onChangeText={(text) =>
                    setBeneficiaryForm({
                      ...beneficiaryForm,
                      beneficiary_id_number: sanitizeSouthAfricanIdNumber(text),
                    })
                  }
                  placeholder="13-digit ID number"
                  keyboardType="number-pad"
                  maxLength={13}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID Number *</Text>
                <TextInput
                  style={styles.input}
                  value={beneficiaryForm.beneficiary_id_number}
                  onChangeText={(text) =>
                    setBeneficiaryForm({
                      ...beneficiaryForm,
                      beneficiary_id_number: sanitizeSouthAfricanIdNumber(text),
                    })
                  }
                  placeholder="13-digit ID number"
                  keyboardType="number-pad"
                  maxLength={13}
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
                disabled={
                  saving ||
                  !beneficiaryForm.beneficiary_first_name ||
                  !beneficiaryForm.beneficiary_surname ||
                  !isValidSouthAfricanIdNumber(beneficiaryForm.beneficiary_id_number || '')
                }
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
                disabled={
                  saving ||
                  !beneficiaryForm.beneficiary_first_name ||
                  !beneficiaryForm.beneficiary_surname ||
                  !isValidSouthAfricanIdNumber(beneficiaryForm.beneficiary_id_number || '')
                }
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

      <Modal
        visible={approvalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!approvalProcessing) {
            setApprovalModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approve Will</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!approvalProcessing) {
                    setApprovalModalVisible(false);
                  }
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.approvalOptions}>
              <TouchableOpacity
                style={styles.approvalOptionButton}
                onPress={() => {
                  setApprovalModalVisible(false);
                  setShowPrintModal(true);
                }}
              >
                <Ionicons name="print-outline" size={24} color={theme.colors.primary} />
                <View style={styles.approvalOptionTextContainer}>
                  <Text style={styles.approvalOptionTitle}>Save & Prepare for Print</Text>
                  <Text style={styles.approvalOptionSubtitle}>
                    Save and ready the Will for immediate printing.
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approvalOptionButton}
                onPress={() => {
                  setApprovalModalVisible(false);
                  setShowCollectionModal(true);
                }}
              >
                <Ionicons name="car-outline" size={24} color={theme.colors.primary} />
                <View style={styles.approvalOptionTextContainer}>
                  <Text style={styles.approvalOptionTitle}>Request Will Collection</Text>
                  <Text style={styles.approvalOptionSubtitle}>
                    Arrange a courier to collect the signed Will.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPrintModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!approvalProcessing) {
            setShowPrintModal(false);
          }
        }}
      >
        <View style={styles.guidedModalOverlay}>
          <View style={styles.guidedModalContainer}>
            <Ionicons name="print-outline" size={42} color={theme.colors.primary} />
            <View style={styles.guidedModalTitleRow}>
              <Text style={styles.guidedModalTitle}>Print Preparation</Text>
            </View>
            <Text style={styles.guidedModalBody}>
              Confirm who will receive the print-ready file and how many copies you need.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={printContactName}
              onChangeText={setPrintContactName}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Email"
              value={printContactEmail}
              onChangeText={setPrintContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Number of Copies"
              value={printCopies}
              onChangeText={setPrintCopies}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Special instructions (Optional)"
              value={printNotes}
              onChangeText={setPrintNotes}
              multiline
            />
            <TouchableOpacity
              style={styles.guidedModalPrimary}
              onPress={handlePrintSubmit}
              disabled={approvalProcessing}
            >
              {approvalProcessing ? (
                <ActivityIndicator color={theme.colors.buttonText} />
              ) : (
                <Text style={styles.guidedModalPrimaryText}>Prepare for Print</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guidedModalCheckboxContainer}
              onPress={() => {
                if (!approvalProcessing) {
                  setShowPrintModal(false);
                }
              }}
            >
              <Text style={styles.approvalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCollectionModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!approvalProcessing) {
            setShowCollectionModal(false);
          }
        }}
      >
        <View style={styles.guidedModalOverlay}>
          <View style={styles.guidedModalContainer}>
            <Ionicons name="car-outline" size={42} color={theme.colors.primary} />
            <View style={styles.guidedModalTitleRow}>
              <Text style={styles.guidedModalTitle}>Collection Details</Text>
            </View>
            <Text style={styles.guidedModalBody}>
              Provide the address and preferred time so we can arrange a courier to collect your signed Will.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Collection Address"
              value={collectionAddress}
              onChangeText={setCollectionAddress}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Collection Date (YYYY-MM-DD)"
              value={collectionDate}
              onChangeText={(value) => setCollectionDate(formatDateInput(value))}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Preferred Time (e.g. 14:00 on 24 Aug)"
              value={collectionTime}
              onChangeText={setCollectionTime}
            />
            <TouchableOpacity
              style={styles.guidedModalPrimary}
              onPress={async () => {
                if (!collectionAddress.trim()) {
                  Alert.alert('Address Required', 'Please confirm the collection address.');
                  return;
                }
                if (!collectionDate.trim() || !isValidDateString(collectionDate.trim())) {
                  Alert.alert('Collection Date', 'Please provide a valid collection date (YYYY-MM-DD).');
                  return;
                }
                if (!collectionTime.trim()) {
                  Alert.alert('Collection Time', 'Please specify a preferred collection time.');
                  return;
                }
                setApprovalProcessing(true);
                setProcessingStatusText('Booking your collection...');
                setShowProcessingOverlay(true);
                const saved = await saveWillDocument();
                if (saved) {
                  setProcessingStatusText('Collection has been booked!');
                  setTimeout(() => {
                    setShowProcessingOverlay(false);
                  Alert.alert(
                    'Collection Requested',
                      `We will arrange collection at:\n${collectionAddress}\nDate: ${collectionDate}\nTime: ${collectionTime}`
                  );
                  setShowCollectionModal(false);
                  }, 800);
                } else {
                  setShowProcessingOverlay(false);
                }
                setApprovalProcessing(false);
              }}
              disabled={approvalProcessing}
            >
              {approvalProcessing ? (
                <ActivityIndicator color={theme.colors.buttonText} />
              ) : (
                <Text style={styles.guidedModalPrimaryText}>Submit Collection Request</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guidedModalCheckboxContainer}
              onPress={() => {
                if (!approvalProcessing) {
                  setShowCollectionModal(false);
                }
              }}
            >
              <Text style={styles.approvalCancelText}>Cancel</Text>
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
          <ScrollView
            style={styles.fabMenu}
            contentContainerStyle={styles.fabMenuContent}
            showsVerticalScrollIndicator={false}
          >
            {beneficiaries.map((beneficiary, index) => (
              <TouchableOpacity
                key={beneficiary.beneficiary_id}
                style={[styles.fab, styles.fabSmall]}
                onPress={() => handleEditBeneficiary(beneficiary)}
              >
                <Text style={styles.fabLabel}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
      {showProcessingOverlay && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.processingText}>{processingStatusText}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ViewWillScreen;
