import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/userService';
import Toast from '../components/Toast';
import { formatSAPhoneNumber, isValidSAPhoneNumber } from '../utils/phoneFormatter';
import { updateProfileStyles as styles } from './UpdateProfileScreen.styles';

interface UpdateProfileScreenProps {
  navigation: any;
}

const UpdateProfileScreen: React.FC<UpdateProfileScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    policyNumber: '',
    profilePicturePath: '',
    dateOfBirth: '',
    employmentStatus: '',
    monthlyIncome: '',
    maritalStatus: '',
    leadSubmissionConsent: false,
  });

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) {
      setToastMessage('No user logged in');
      setToastType('error');
      setShowToast(true);
      setLoading(false);
      return;
    }

    try {
      const userData = await UserService.getUserById(currentUser.uid);
      if (userData) {
        setFormData({
          firstName: userData.first_name || '',
          surname: userData.surname || '',
          fullName: userData.full_name || `${userData.first_name || ''} ${userData.surname || ''}`.trim(),
          email: userData.email || '',
          phone: userData.phone || '',
          idNumber: userData.id_number || '',
          policyNumber: userData.policy_number || '',
          profilePicturePath: userData.profile_picture_path || '',
          dateOfBirth: userData.date_of_birth || '',
          employmentStatus: userData.employment_status || '',
          monthlyIncome: userData.monthly_income ? String(userData.monthly_income) : '',
          maritalStatus: userData.marital_status || '',
          leadSubmissionConsent: !!userData.lead_submission_consent,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setToastMessage('Failed to load user data');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      setToastMessage('No user logged in');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // Validate phone number format
    if (formData.phone && !isValidSAPhoneNumber(formData.phone)) {
      setToastMessage('Please enter a valid South African phone number');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // Validate required fields
    if (!formData.firstName.trim() || !formData.surname.trim()) {
      setToastMessage('First name and surname are required');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        first_name: formData.firstName.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
      };

      // Format and add phone if provided
      if (formData.phone) {
        updateData.phone = formatSAPhoneNumber(formData.phone);
      }

      // Add profile picture if changed
      if (formData.profilePicturePath) {
        updateData.profile_picture_path = formData.profilePicturePath;
      }

      // Capital Legacy related fields
      if (formData.dateOfBirth) {
        updateData.date_of_birth = formData.dateOfBirth;
      }
      if (formData.employmentStatus) {
        updateData.employment_status = formData.employmentStatus as any;
      }
      if (formData.monthlyIncome) {
        updateData.monthly_income = Number(formData.monthlyIncome);
      }
      if (formData.maritalStatus) {
        updateData.marital_status = formData.maritalStatus as any;
      }
      updateData.lead_submission_consent = !!formData.leadSubmissionConsent;
      if (formData.leadSubmissionConsent) {
        updateData.lead_submission_consent_at = new Date();
      }

      await UserService.updateUser(currentUser.uid, updateData);
      
      setToastMessage('Profile updated successfully');
      setToastType('success');
      setShowToast(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToastMessage('Failed to update profile');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateFormData('profilePicturePath', result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Update Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Personal Information</Text>
          <View style={styles.iconContainer}>
            {formData.profilePicturePath ? (
              <Image source={{ uri: formData.profilePicturePath }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={60} color={theme.colors.primary} />
              </View>
            )}
          </View>
          <TouchableOpacity onPress={pickProfileImage} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Update your personal details</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            placeholder="Surname"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.surname}
            onChangeText={(value) => updateFormData('surname', value)}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g., 082 581 6642)"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>ID Number</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="ID Number"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.idNumber}
            editable={false}
          />
          <Text style={styles.helpText}>ID Number cannot be changed</Text>

          <Text style={styles.label}>Policy Number</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="Policy Number"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.policyNumber}
            editable={false}
          />
          <Text style={styles.helpText}>Policy Number is auto-generated</Text>

          <Text style={styles.title}>Capital Legacy Consultation Profile</Text>

          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (YYYY-MM-DD)"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.dateOfBirth}
            onChangeText={(value) => updateFormData('dateOfBirth', value)}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Employment Status</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., employed, self_employed, unemployed"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.employmentStatus}
            onChangeText={(value) => updateFormData('employmentStatus', value)}
          />

          <Text style={styles.label}>Monthly Income (Optional, ZAR)</Text>
          <TextInput
            style={styles.input}
            placeholder="Monthly Income"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.monthlyIncome}
            onChangeText={(value) => updateFormData('monthlyIncome', value)}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Marital Status</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., single, married, divorced"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.maritalStatus}
            onChangeText={(value) => updateFormData('maritalStatus', value)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.buttonText} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <Toast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UpdateProfileScreen;

