import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/userService';
import ExecutorService from '../services/executorService';
import NotificationService from '../services/notificationService';
import { formatSAPhoneNumber } from '../utils/phoneFormatter';
import { updateExecutorStyles as styles } from './UpdateExecutorScreen.styles';

interface UpdateExecutorScreenProps {
  navigation: any;
}

const UpdateExecutorScreen: React.FC<UpdateExecutorScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    executorFirstName: '',
    executorSurname: '',
    executorIdNumber: '',
    executorRelationship: '',
    executorEmail: '',
    executorPhone: '',
    executorAddress: '',
  });

  const [existingExecutorId, setExistingExecutorId] = useState<string | null>(null);

  useEffect(() => {
    loadExistingExecutor();
  }, []);

  const loadExistingExecutor = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const executors = await ExecutorService.getUserExecutors(currentUser.uid);
      
      if (executors && executors.length > 0) {
        const executor = executors[0]; // Get primary executor
        setExistingExecutorId(executor.executor_id);
        setFormData({
          executorFirstName: executor.executor_first_name || '',
          executorSurname: executor.executor_surname || '',
          executorIdNumber: executor.executor_id_number || '',
          executorRelationship: executor.relationship_to_user || '',
          executorEmail: executor.executor_email || '',
          executorPhone: executor.executor_phone || '',
          executorAddress: executor.executor_address || '',
        });
      }
    } catch (error) {
      console.error('Error loading executor:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to update executor information.');
      return;
    }

    // Validation
    if (!formData.executorFirstName.trim() || !formData.executorSurname.trim()) {
      Alert.alert('Validation Error', 'Please enter executor first name and surname.');
      return;
    }

    if (!formData.executorIdNumber.trim() || !formData.executorRelationship.trim()) {
      Alert.alert('Validation Error', 'Please enter executor ID number and relationship.');
      return;
    }

    if (!formData.executorEmail.trim() || !formData.executorPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter executor email and phone number.');
      return;
    }

    try {
      setSaving(true);

      const executorData = {
        user_id: currentUser.uid,
        executor_first_name: formData.executorFirstName.trim(),
        executor_surname: formData.executorSurname.trim(),
        executor_name: `${formData.executorFirstName.trim()} ${formData.executorSurname.trim()}`.trim(),
        executor_id_number: formData.executorIdNumber.trim(),
        relationship_to_user: formData.executorRelationship.trim(),
        executor_email: formData.executorEmail.trim(),
        executor_phone: formatSAPhoneNumber(formData.executorPhone.trim()),
        executor_address: formData.executorAddress.trim() || '',
        is_primary: true,
        verification_status: 'pending' as const,
      };

      if (existingExecutorId) {
        // Update existing executor
        await ExecutorService.updateExecutor(existingExecutorId, executorData);
      } else {
        // Create new executor
        await ExecutorService.createExecutor(executorData);
      }

      // Update user profile to reflect they now have their own executor
      await UserService.updateUser(currentUser.uid, {
        has_own_executor: true,
        executor_notification_dismissed: true,
      });

      // Dismiss any MiWill executor assignment notifications and create success notification
      try {
        const notifications = await NotificationService.getUserNotifications(currentUser.uid);
        const miWillExecutorNotifications = notifications.filter(
          n => n.notification_type === 'executor_assignment' && 
          n.notification_title.includes('MiWill Executor')
        );
        
        for (const notification of miWillExecutorNotifications) {
          await NotificationService.markAsDismissed(notification.notification_id);
        }
        
        // Create success notification
        const executorName = `${formData.executorFirstName.trim()} ${formData.executorSurname.trim()}`;
        await NotificationService.createExecutorUpdateNotification(currentUser.uid, executorName);
        
        console.log('[UpdateExecutor] Dismissed old notifications and created success notification');
      } catch (notifError) {
        console.error('[UpdateExecutor] Error managing notifications:', notifError);
      }

      Alert.alert(
        'Success',
        'Your executor information has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving executor:', error);
      Alert.alert('Error', error.message || 'Failed to save executor information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading executor information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Executor</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
            <Text style={styles.infoText}>
              Update your executor information below. This will replace any MiWill-assigned executor with your own.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Executor Information</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorFirstName}
              onChangeText={(value) => updateFormData('executorFirstName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorSurname}
              onChangeText={(value) => updateFormData('executorSurname', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="ID Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorIdNumber}
              onChangeText={(value) => updateFormData('executorIdNumber', value)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g., Brother, Friend)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorRelationship}
              onChangeText={(value) => updateFormData('executorRelationship', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorEmail}
              onChangeText={(value) => updateFormData('executorEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g. 082 581 6642)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorPhone}
              onChangeText={(value) => updateFormData('executorPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Address (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorAddress}
              onChangeText={(value) => updateFormData('executorAddress', value)}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.buttonText} />
            ) : (
              <Text style={styles.saveButtonText}>Save Executor Information</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UpdateExecutorScreen;

