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
  Image,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import * as ImagePicker from 'expo-image-picker';
import AuthService from '../services/authService';
import UserService from '../services/userService';
import AttorneyService from '../services/attorneyService';
import ExecutorService from '../services/executorService';
import SecondaryContactService from '../services/secondaryContactService';

const { width, height } = Dimensions.get('window');

interface RegistrationScreenProps {
  navigation: any;
}

type StepData = {
  email: string;
  phone: string;
  fullName: string;
  idNumber: string;
  policyNumber: string;
  profilePicturePath: string;
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_years' | '';
  customYears: string;
  customMonths: string;
  attorneySkipped: boolean;
  attorneyName: string;
  attorneyEmail: string;
  attorneyPhone: string;
  attorneyFirm: string;
  attorneyAddress: string;
  executorSameAsAttorney: boolean;
  executorName: string;
  executorEmail: string;
  executorPhone: string;
  executorIdNumber: string;
  executorRelationship: string;
  executorAddress: string;
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
  secondaryContactRelationship: string;
  password: string;
  confirmPassword: string;
};

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState<StepData>({
    email: '',
    phone: '',
    fullName: '',
    idNumber: '',
    policyNumber: '',
    profilePicturePath: '',
    notificationFrequency: '',
    customYears: '1',
    customMonths: '0',
    attorneySkipped: false,
    attorneyName: '',
    attorneyEmail: '',
    attorneyPhone: '',
    attorneyFirm: '',
    attorneyAddress: '',
    executorSameAsAttorney: false,
    executorName: '',
    executorEmail: '',
    executorPhone: '',
    executorIdNumber: '',
    executorRelationship: '',
    executorAddress: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    secondaryContactPhone: '',
    secondaryContactRelationship: '',
    password: '',
    confirmPassword: '',
  });

  const totalSteps = 7;

  // Simple validators
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Min 8, upper, lower, digit, special, no spaces
  const isValidPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd) && !/\s/.test(pwd);

  const [fieldError, setFieldError] = useState<string | null>(null);

  // Auto-generate policy number on mount
  useEffect(() => {
    const generatePolicyNumber = () => {
      const prefix = 'POL';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${timestamp}-${random}`;
    };

    if (!formData.policyNumber) {
      updateFormData('policyNumber', generatePolicyNumber());
    }
  }, []);

  const updateFormData = (field: keyof StepData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExecutorSameAsAttorney = () => {
    if (!formData.attorneySkipped) {
      updateFormData('executorSameAsAttorney', true);
      updateFormData('executorName', formData.attorneyName);
      updateFormData('executorEmail', formData.attorneyEmail);
      updateFormData('executorPhone', formData.attorneyPhone);
      updateFormData('executorAddress', formData.attorneyAddress);
    }
  };

  const pickProfileImage = async () => {
    // Check current permission first
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let granted = current.granted;

    if (!granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      granted = requested.granted;
    }

    if (!granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access to choose a profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings?.() },
        ]
      );
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

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      // Validate required fields on step 0 before moving on
      if (currentStep === 0) {
        if (!formData.fullName.trim()) {
          setFieldError('Please enter your full name.');
          return;
        }
        if (!isValidEmail(formData.email)) {
          setFieldError('Please enter a valid email address.');
          return;
        }
        if (!isValidPassword(formData.password)) {
          setFieldError('Password must be 8+ chars with upper, lower, number and symbol.');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setFieldError('Passwords do not match.');
          return;
        }
        setFieldError(null);
      }
      // Animate out
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
        // Animate in
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
      // Complete registration
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      // 1) Create auth account
      const cred = await AuthService.register(formData.email.trim(), formData.password);
      const uid = cred.user.uid;

      // 2) Map notification frequency
      let notification_frequency: any = formData.notificationFrequency as any;
      let custom_days: number | undefined = undefined;
      if (formData.notificationFrequency === 'custom_years') {
        notification_frequency = 'custom_days';
        const years = parseInt(formData.customYears || '1', 10);
        const months = parseInt(formData.customMonths || '0', 10);
        custom_days = years * 365 + months * 30; // rough conversion
      }

      // 3) Create user document
      await UserService.createUser(uid, {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        full_name: formData.fullName.trim(),
        id_number: formData.idNumber.trim(),
        policy_number: formData.policyNumber,
        profile_picture_path: formData.profilePicturePath || '',
        notification_frequency,
        custom_frequency_days: custom_days,
      } as any);

      // 4) Create linked records
      if (!formData.attorneySkipped && formData.attorneyName.trim()) {
        await AttorneyService.createAttorney({
          user_id: uid,
          attorney_name: formData.attorneyName.trim(),
          attorney_email: formData.attorneyEmail.trim(),
          attorney_phone: formData.attorneyPhone.trim(),
          attorney_firm: formData.attorneyFirm?.trim() || '',
          attorney_address: formData.attorneyAddress?.trim() || '',
          relationship_type: 'estate_lawyer',
          is_primary: true,
        });
      }

      if (formData.executorName.trim()) {
        await ExecutorService.createExecutor({
          user_id: uid,
          executor_name: formData.executorName.trim(),
          executor_email: formData.executorEmail.trim(),
          executor_phone: formData.executorPhone.trim(),
          executor_id_number: formData.executorIdNumber.trim(),
          relationship_to_user: formData.executorRelationship.trim(),
          executor_address: formData.executorAddress?.trim() || '',
          is_primary: true,
          verification_status: 'pending',
        } as any);
      }

      if (formData.secondaryContactName.trim()) {
        await SecondaryContactService.createSecondaryContact({
          user_id: uid,
          contact_name: formData.secondaryContactName.trim(),
          contact_email: formData.secondaryContactEmail.trim(),
          contact_phone: formData.secondaryContactPhone.trim(),
          relationship_to_user: formData.secondaryContactRelationship.trim(),
          contact_address: '',
          is_verified: false,
        });
      }

      // 5) Navigate to dashboard
      navigation.navigate('Dashboard');
    } catch (e: any) {
      console.error('Registration error:', e);
      
      // Show user-friendly error message
      let errorMessage = 'Registration failed. Please try again.';
      if (e.message?.includes('email-already-in-use')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (e.message?.includes('invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (e.message?.includes('weak-password')) {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      Alert.alert('Registration Failed', errorMessage, [
        { text: 'OK' }
      ]);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      // Animate out
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
        // Animate in
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

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>
    );
  };

  const renderCustomYearsMonthsOptions = () => {
    const options = [];
    for (let years = 1; years <= 5; years++) {
      for (let months = 0; months <= 11; months++) {
        const label = months === 0 
          ? `${years} year${years > 1 ? 's' : ''}`
          : `${years} year${years > 1 ? 's' : ''} and ${months} month${months > 1 ? 's' : ''}`;
        options.push(
          <TouchableOpacity
            key={`${years}-${months}`}
            style={[
              styles.customYearOption,
              formData.customYears === years.toString() && 
              formData.customMonths === months.toString() && 
              styles.customYearOptionActive,
            ]}
            onPress={() => {
              updateFormData('customYears', years.toString());
              updateFormData('customMonths', months.toString());
            }}
          >
            <Text style={styles.customYearText}>{label}</Text>
          </TouchableOpacity>
        );
      }
    }
    return options;
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
            <Text style={styles.stepTitle}>Welcome to MiWill</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Let's start with your personal information</Text>

            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickProfileImage}>
                {formData.profilePicturePath ? (
                  <Image source={{ uri: formData.profilePicturePath }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={28} color={theme.colors.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={pickProfileImage}>
                <Text style={styles.changePhotoText}>Add/Change Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelLinkText}>Cancel Registration</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="ID Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.idNumber}
              onChangeText={(value) => updateFormData('idNumber', value)}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Policy Number (Auto-generated)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.policyNumber}
              editable={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />

            {fieldError ? (
              <Text style={styles.validationError}>{fieldError}</Text>
            ) : null}
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Well-being Frequency Notification</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>
              How often should we check up on you?
            </Text>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'daily' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'daily')}
            >
              <Ionicons name="sunny-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Daily</Text>
              <Text style={styles.frequencySubtext}>Every day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'weekly' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'weekly')}
            >
              <Ionicons name="calendar-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Weekly</Text>
              <Text style={styles.frequencySubtext}>Once a week</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'monthly' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'monthly')}
            >
              <Ionicons name="calendar-number-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Monthly</Text>
              <Text style={styles.frequencySubtext}>Once a month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'quarterly' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'quarterly')}
            >
              <Ionicons name="time-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Quarterly</Text>
              <Text style={styles.frequencySubtext}>Every 3 months</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'yearly' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'yearly')}
            >
              <Ionicons name="calendar-clear-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Yearly</Text>
              <Text style={styles.frequencySubtext}>Once a year</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'custom_years' && styles.frequencyOptionActive,
              ]}
              onPress={() => updateFormData('notificationFrequency', 'custom_years')}
            >
              <Ionicons name="create-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Custom (1+ Years)</Text>
              <Text style={styles.frequencySubtext}>Choose years and months</Text>
            </TouchableOpacity>

            {formData.notificationFrequency === 'custom_years' && (
              <ScrollView style={styles.customYearsContainer} nestedScrollEnabled>
                {renderCustomYearsMonthsOptions()}
              </ScrollView>
            )}
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Attorney Information</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="gavel" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Who's handling your legal affairs?</Text>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                updateFormData('attorneySkipped', true);
                nextStep();
              }}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Attorney Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyName}
              onChangeText={(value) => updateFormData('attorneyName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Attorney Email"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyEmail}
              onChangeText={(value) => updateFormData('attorneyEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Attorney Phone Number"
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
              style={styles.input}
              placeholder="Attorney Address (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.attorneyAddress}
              onChangeText={(value) => updateFormData('attorneyAddress', value)}
              multiline
            />
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Executor Information</Text>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="file-signature" size={50} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Who will execute your will?</Text>

            {!formData.attorneySkipped && (
              <TouchableOpacity
                style={styles.sameAsButton}
                onPress={handleExecutorSameAsAttorney}
              >
                <Text style={styles.sameAsButtonText}>Same Information as Attorney</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.input}
              placeholder="Executor Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorName}
              onChangeText={(value) => updateFormData('executorName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Executor ID Number"
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
              placeholder="Executor Email"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorEmail}
              onChangeText={(value) => updateFormData('executorEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Executor Phone Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorPhone}
              onChangeText={(value) => updateFormData('executorPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Executor Address (Optional)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorAddress}
              onChangeText={(value) => updateFormData('executorAddress', value)}
              multiline
            />
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Secondary Contact</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>
              A backup contact to verify your well-being
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contact Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactName}
              onChangeText={(value) => updateFormData('secondaryContactName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g., Spouse, Friend)"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactRelationship}
              onChangeText={(value) => updateFormData('secondaryContactRelationship', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Contact Email"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactEmail}
              onChangeText={(value) => updateFormData('secondaryContactEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Contact Phone Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactPhone}
              onChangeText={(value) => updateFormData('secondaryContactPhone', value)}
              keyboardType="phone-pad"
            />
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <Text style={styles.stepTitle}>Review Your Information</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Please review your details before continuing</Text>

            <ScrollView style={styles.reviewContainer} nestedScrollEnabled>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Personal Information</Text>
                <Text style={styles.reviewItem}>Name: {formData.fullName}</Text>
                <Text style={styles.reviewItem}>Email: {formData.email}</Text>
                <Text style={styles.reviewItem}>Phone: {formData.phone}</Text>
                <Text style={styles.reviewItem}>ID: {formData.idNumber}</Text>
                <Text style={styles.reviewItem}>Policy: {formData.policyNumber}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Notification Settings</Text>
                <Text style={styles.reviewItem}>
                  Frequency: {formData.notificationFrequency}
                  {formData.notificationFrequency === 'custom_years' && 
                    ` (${formData.customYears} year${parseInt(formData.customYears) > 1 ? 's' : ''} ${
                      formData.customMonths !== '0' 
                        ? `and ${formData.customMonths} month${parseInt(formData.customMonths) > 1 ? 's' : ''}` 
                        : ''
                    })`}
                </Text>
              </View>

              {!formData.attorneySkipped && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Attorney</Text>
                  <Text style={styles.reviewItem}>Name: {formData.attorneyName}</Text>
                  <Text style={styles.reviewItem}>Email: {formData.attorneyEmail}</Text>
                </View>
              )}

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Executor</Text>
                <Text style={styles.reviewItem}>Name: {formData.executorName}</Text>
                <Text style={styles.reviewItem}>Relationship: {formData.executorRelationship}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Secondary Contact</Text>
                <Text style={styles.reviewItem}>Name: {formData.secondaryContactName}</Text>
                <Text style={styles.reviewItem}>Relationship: {formData.secondaryContactRelationship}</Text>
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.completionContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.completionLogo}
                resizeMode="contain"
              />
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
              </View>
              <Text style={styles.completionTitle}>All Set!</Text>
              <Text style={styles.completionText}>
                Your MiWill account is ready. You can now add your assets, policies, and
                beneficiaries from the dashboard.
              </Text>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderProgressBar()}
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
            >
              <Text style={styles.nextButtonText}>
                {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
              </Text>
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
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    minHeight: height * 0.55,
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
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  changePhotoText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
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
  inputDisabled: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textSecondary,
  },
  frequencyOption: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  frequencyText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  frequencySubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  customYearsContainer: {
    maxHeight: 300,
    marginTop: theme.spacing.md,
  },
  customYearOption: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  customYearOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  customYearText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  skipButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium as any,
    textDecorationLine: 'underline',
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  cancelLinkText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold as any,
  },
  sameAsButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  sameAsButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
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
  validationError: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  completionContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  completionLogo: {
    width: 120,
    height: 80,
    marginBottom: theme.spacing.lg,
  },
  completionTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  completionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    paddingHorizontal: theme.spacing.lg,
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
});

export default RegistrationScreen;
