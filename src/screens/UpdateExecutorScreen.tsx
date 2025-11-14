import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import { formatSAPhoneNumber } from '../utils/phoneFormatter';

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
    marginLeft: theme.spacing.md,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
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
  textArea: {
    height: 100,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
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
});

export default UpdateExecutorScreen;

