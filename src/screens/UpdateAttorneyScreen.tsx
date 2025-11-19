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
import AttorneyService from '../services/attorneyService';
import NotificationService from '../services/notificationService';
import { formatSAPhoneNumber } from '../utils/phoneFormatter';

interface UpdateAttorneyScreenProps {
  navigation: any;
}

const UpdateAttorneyScreen: React.FC<UpdateAttorneyScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    attorneyFirstName: '',
    attorneySurname: '',
    attorneyEmail: '',
    attorneyPhone: '',
    attorneyFirm: '',
    attorneyAddress: '',
  });

  const [existingAttorneyId, setExistingAttorneyId] = useState<string | null>(null);

  useEffect(() => {
    loadExistingAttorney();
  }, []);

  const loadExistingAttorney = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const attorneys = await AttorneyService.getUserAttorneys(currentUser.uid);
      
      if (attorneys && attorneys.length > 0) {
        const attorney = attorneys[0]; // Get primary attorney
        setExistingAttorneyId(attorney.attorney_id);
        setFormData({
          attorneyFirstName: attorney.attorney_first_name || '',
          attorneySurname: attorney.attorney_surname || '',
          attorneyEmail: attorney.attorney_email || '',
          attorneyPhone: attorney.attorney_phone || '',
          attorneyFirm: attorney.attorney_firm || '',
          attorneyAddress: attorney.attorney_address || '',
        });
      }
    } catch (error) {
      console.error('Error loading attorney:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to update attorney information.');
      return;
    }

    // Validation
    if (!formData.attorneyFirstName.trim() || !formData.attorneySurname.trim()) {
      Alert.alert('Validation Error', 'Please enter attorney first name and surname.');
      return;
    }

    if (!formData.attorneyEmail.trim() || !formData.attorneyPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter attorney email and phone number.');
      return;
    }

    try {
      setSaving(true);

      const attorneyData = {
        user_id: currentUser.uid,
        attorney_first_name: formData.attorneyFirstName.trim(),
        attorney_surname: formData.attorneySurname.trim(),
        attorney_name: `${formData.attorneyFirstName.trim()} ${formData.attorneySurname.trim()}`.trim(),
        attorney_email: formData.attorneyEmail.trim(),
        attorney_phone: formatSAPhoneNumber(formData.attorneyPhone.trim()),
        attorney_firm: formData.attorneyFirm.trim() || '',
        attorney_address: formData.attorneyAddress.trim() || '',
        relationship_type: 'estate_lawyer' as const,
        is_primary: true,
      };

      if (existingAttorneyId) {
        // Update existing attorney
        await AttorneyService.updateAttorney(existingAttorneyId, attorneyData);
      } else {
        // Create new attorney
        await AttorneyService.createAttorney(attorneyData);
      }

      // Update user profile to reflect they now have their own attorney
      await UserService.updateUser(currentUser.uid, {
        has_own_attorney: true,
        attorney_notification_dismissed: true,
      });

      // Dismiss any MiWill attorney assignment notifications and create success notification
      try {
        const notifications = await NotificationService.getUserNotifications(currentUser.uid);
        const miWillAttorneyNotifications = notifications.filter(
          n => n.notification_type === 'attorney_assignment' && 
          n.notification_title.includes('MiWill Partner Attorney')
        );
        
        for (const notification of miWillAttorneyNotifications) {
          await NotificationService.markAsDismissed(notification.notification_id);
        }
        
        // Create success notification
        const attorneyName = `${formData.attorneyFirstName.trim()} ${formData.attorneySurname.trim()}`;
        await NotificationService.createAttorneyUpdateNotification(currentUser.uid, attorneyName);
        
        console.log('[UpdateAttorney] Dismissed old notifications and created success notification');
      } catch (notifError) {
        console.error('[UpdateAttorney] Error managing notifications:', notifError);
      }

      Alert.alert(
        'Success',
        'Your attorney information has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving attorney:', error);
      Alert.alert('Error', error.message || 'Failed to save attorney information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading attorney information...</Text>
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
          <Text style={styles.headerTitle}>Update Attorney</Text>
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
              Update your attorney information below. This will replace any MiWill-assigned attorney with your own.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Attorney Information</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyFirstName}
              onChangeText={(value) => updateFormData('attorneyFirstName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneySurname}
              onChangeText={(value) => updateFormData('attorneySurname', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyEmail}
              onChangeText={(value) => updateFormData('attorneyEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g. 082 581 6642)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyPhone}
              onChangeText={(value) => updateFormData('attorneyPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Law Firm (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyFirm}
              onChangeText={(value) => updateFormData('attorneyFirm', value)}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Attorney Address (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyAddress}
              onChangeText={(value) => updateFormData('attorneyAddress', value)}
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
              <Text style={styles.saveButtonText}>Save Attorney Information</Text>
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

export default UpdateAttorneyScreen;

