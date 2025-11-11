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
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import * as ImagePicker from 'expo-image-picker';
import AuthService from '../services/authService';
import UserService from '../services/userService';
import AttorneyService from '../services/attorneyService';
import ExecutorService from '../services/executorService';
import SecondaryContactService from '../services/secondaryContactService';
import { formatSAPhoneNumber, isValidSAPhoneNumber } from '../utils/phoneFormatter';

const { width, height } = Dimensions.get('window');

interface RegistrationScreenProps {
  navigation: any;
}

type StepData = {
  email: string;
  phone: string;
  firstName: string;
  surname: string;
  idNumber: string;
  policyNumber: string;
  profilePicturePath: string;
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_years' | '';
  customYears: string;
  customMonths: string;
  attorneySkipped: boolean;
  attorneyFirstName: string;
  attorneySurname: string;
  attorneyEmail: string;
  attorneyPhone: string;
  attorneyFirm: string;
  attorneyAddress: string;
  executorSameAsAttorney: boolean;
  executorFirstName: string;
  executorSurname: string;
  executorEmail: string;
  executorPhone: string;
  executorIdNumber: string;
  executorRelationship: string;
  executorAddress: string;
  secondaryContactFirstName: string;
  secondaryContactSurname: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
  secondaryContactRelationship: string;
  password: string;
  confirmPassword: string;
  popiaAccepted: boolean;
};

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState<StepData>({
    email: '',
    phone: '',
    firstName: '',
    surname: '',
    idNumber: '',
    policyNumber: '',
    profilePicturePath: '',
    notificationFrequency: '',
    customYears: '1',
    customMonths: '0',
    attorneySkipped: false,
    attorneyFirstName: '',
    attorneySurname: '',
    attorneyEmail: '',
    attorneyPhone: '',
    attorneyFirm: '',
    attorneyAddress: '',
    executorSameAsAttorney: false,
    executorFirstName: '',
    executorSurname: '',
    executorEmail: '',
    executorPhone: '',
    executorIdNumber: '',
    executorRelationship: '',
    executorAddress: '',
    secondaryContactFirstName: '',
    secondaryContactSurname: '',
    secondaryContactEmail: '',
    secondaryContactPhone: '',
    secondaryContactRelationship: '',
    password: '',
    confirmPassword: '',
    popiaAccepted: false,
  });

  const totalSteps = 7;

  // Simple validators
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Min 8, upper, lower, digit, special, no spaces
  const isValidPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd) && !/\s/.test(pwd);

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Check if current step has all required fields filled
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0: // Personal Information
        return !!(
          formData.firstName.trim() &&
          formData.surname.trim() &&
          formData.email.trim() &&
          formData.password.trim() &&
          formData.confirmPassword.trim() &&
          formData.popiaAccepted
        );
      case 1: // Notification Frequency
        return !!formData.notificationFrequency;
      case 2: // Attorney (optional, always valid)
        return true;
      case 3: // Executor
        return !!(
          formData.executorFirstName.trim() &&
          formData.executorSurname.trim() &&
          formData.executorIdNumber.trim() &&
          formData.executorRelationship.trim() &&
          formData.executorEmail.trim() &&
          formData.executorPhone.trim()
        );
      case 4: // Secondary Contact
        return !!(
          formData.secondaryContactFirstName.trim() &&
          formData.secondaryContactSurname.trim() &&
          formData.secondaryContactRelationship.trim() &&
          formData.secondaryContactEmail.trim() &&
          formData.secondaryContactPhone.trim()
        );
      case 5: // Review (always valid)
      case 6: // Completion (always valid)
        return true;
      default:
        return false;
    }
  };

  // Auto-generate policy number on mount
  useEffect(() => {
    const generatePolicyNumber = () => {
      const prefix = 'POL-MW';
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
    if (formData.attorneySkipped) {
      return;
    }

    const firstName = (formData.attorneyFirstName || '').trim();
    const surname = (formData.attorneySurname || '').trim();
    const email = (formData.attorneyEmail || '').trim();
    const phoneRaw = formData.attorneyPhone || '';
    const phoneFormatted = phoneRaw ? formatSAPhoneNumber(phoneRaw) : '';
    const address = (formData.attorneyAddress || '').trim();

    updateFormData('executorSameAsAttorney', true);
    updateFormData('executorFirstName', firstName);
    updateFormData('executorSurname', surname);
    updateFormData('executorEmail', email);
    updateFormData('executorPhone', phoneFormatted);
    updateFormData('executorAddress', address);
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
        if (!formData.popiaAccepted) {
          setFieldError('Please accept the POPIA Act and Terms of Use to continue.');
          return;
        }
        if (!formData.firstName.trim()) {
          setFieldError('Please enter your first name.');
          return;
        }
        if (!formData.surname.trim()) {
          setFieldError('Please enter your surname.');
          return;
        }
        if (!isValidEmail(formData.email)) {
          setFieldError('Please enter a valid email address.');
          return;
        }
        if (formData.phone && !isValidSAPhoneNumber(formData.phone)) {
          setFieldError('Please enter a valid South African phone number.');
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

      // 3) Create user document with formatted phone
      const formattedPhone = formatSAPhoneNumber(formData.phone.trim());
      await UserService.createUser(uid, {
        email: formData.email.trim(),
        phone: formattedPhone,
        first_name: formData.firstName.trim(),
        surname: formData.surname.trim(),
        id_number: formData.idNumber.trim(),
        policy_number: formData.policyNumber,
        profile_picture_path: formData.profilePicturePath || '',
        notification_frequency,
        custom_frequency_days: custom_days,
        popia_accepted: formData.popiaAccepted,
      } as any);

      // 4) Create linked records
      if (
        !formData.attorneySkipped &&
        (formData.attorneyFirstName.trim() || formData.attorneySurname.trim())
      ) {
        await AttorneyService.createAttorney({
          user_id: uid,
          attorney_first_name: formData.attorneyFirstName.trim(),
          attorney_surname: formData.attorneySurname.trim(),
          attorney_name: `${formData.attorneyFirstName.trim()} ${formData.attorneySurname.trim()}`.trim(),
          attorney_email: formData.attorneyEmail.trim(),
          attorney_phone: formData.attorneyPhone.trim(),
          attorney_firm: formData.attorneyFirm?.trim() || '',
          attorney_address: formData.attorneyAddress?.trim() || '',
          relationship_type: 'estate_lawyer',
          is_primary: true,
        });
      }

      if (formData.executorFirstName.trim() || formData.executorSurname.trim()) {
        await ExecutorService.createExecutor({
          user_id: uid,
          executor_first_name: formData.executorFirstName.trim(),
          executor_surname: formData.executorSurname.trim(),
          executor_name: `${formData.executorFirstName.trim()} ${formData.executorSurname.trim()}`.trim(),
          executor_email: formData.executorEmail.trim(),
          executor_phone: formData.executorPhone.trim(),
          executor_id_number: formData.executorIdNumber.trim(),
          relationship_to_user: formData.executorRelationship.trim(),
          executor_address: formData.executorAddress?.trim() || '',
          is_primary: true,
          verification_status: 'pending',
        } as any);
      }

      if (formData.secondaryContactFirstName.trim() || formData.secondaryContactSurname.trim()) {
        await SecondaryContactService.createSecondaryContact({
          user_id: uid,
          contact_first_name: formData.secondaryContactFirstName.trim(),
          contact_surname: formData.secondaryContactSurname.trim(),
          contact_name: `${formData.secondaryContactFirstName.trim()} ${formData.secondaryContactSurname.trim()}`.trim(),
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

  const renderCustomYearsOptions = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const years = index + 1;
      const isActive = formData.customYears === years.toString();
      return (
        <TouchableOpacity
          key={`custom-year-${years}`}
          style={[
            styles.customYearOption,
            isActive && styles.customYearOptionActive,
          ]}
          onPress={() => {
            updateFormData('customYears', years.toString());
            updateFormData('customMonths', '0');
          }}
        >
          <Text style={styles.customYearText}>{`${years} year${years > 1 ? 's' : ''}`}</Text>
        </TouchableOpacity>
      );
    });
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
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
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

            {/* Policy Number Display (not editable) */}
            <View style={styles.policyNumberDisplay}>
              <Text style={styles.policyNumberLabel}>Your Policy Number:</Text>
              <Text style={styles.policyNumberValue}>{formData.policyNumber}</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.surname}
              onChangeText={(value) => updateFormData('surname', value)}
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
              placeholder="Phone Number (e.g. 082 581 6642)"
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

            {/* POPIA Checkbox */}
            <View style={styles.popiaContainer}>
              <TouchableOpacity
                onPress={() => updateFormData('popiaAccepted', !formData.popiaAccepted)}
                style={styles.checkboxWrapper}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: formData.popiaAccepted }}
              >
                <View style={[styles.checkbox, formData.popiaAccepted && styles.checkboxChecked]}>
                  {formData.popiaAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.popiaText}>
                I accept the{' '}
                <Text style={styles.popiaLink} onPress={() => setShowPopiaModal(true)}>
                  POPIA Act
                </Text>
                {' '}terms and conditions and{' '}
                <Text style={styles.popiaLink} onPress={() => setShowTermsModal(true)}>
                  Terms of Use
                </Text>
              </Text>
            </View>

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
              <Text style={styles.frequencyText}>Custom (1-5 Years)</Text>
              <Text style={styles.frequencySubtext}>Choose number of years</Text>
            </TouchableOpacity>

            {formData.notificationFrequency === 'custom_years' && (
              <ScrollView style={styles.customYearsContainer} nestedScrollEnabled>
                {renderCustomYearsOptions()}
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
              placeholder="Email"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorEmail}
              onChangeText={(value) => updateFormData('executorEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.executorPhone}
              onChangeText={(value) => updateFormData('executorPhone', value)}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Address (Optional)"
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
              placeholder="First Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactFirstName}
              onChangeText={(value) => updateFormData('secondaryContactFirstName', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactSurname}
              onChangeText={(value) => updateFormData('secondaryContactSurname', value)}
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
                <Text style={styles.reviewItem}>Name: {formData.firstName} {formData.surname}</Text>
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
                    ` (${formData.customYears} year${parseInt(formData.customYears) > 1 ? 's' : ''})`}
                </Text>
              </View>

              {!formData.attorneySkipped && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Attorney</Text>
                  <Text style={styles.reviewItem}>
                    Name: {`${formData.attorneyFirstName} ${formData.attorneySurname}`.trim()}
                  </Text>
                  {formData.attorneyEmail ? (
                    <Text style={styles.reviewItem}>Email: {formData.attorneyEmail}</Text>
                  ) : null}
                  {formData.attorneyPhone ? (
                    <Text style={styles.reviewItem}>Phone: {formData.attorneyPhone}</Text>
                  ) : null}
                  {formData.attorneyFirm ? (
                    <Text style={styles.reviewItem}>Firm: {formData.attorneyFirm}</Text>
                  ) : null}
                  {formData.attorneyAddress ? (
                    <Text style={styles.reviewItem}>Address: {formData.attorneyAddress}</Text>
                  ) : null}
                </View>
              )}

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Executor</Text>
                <Text style={styles.reviewItem}>
                  Name: {`${formData.executorFirstName} ${formData.executorSurname}`.trim()}
                </Text>
                {formData.executorEmail ? (
                  <Text style={styles.reviewItem}>Email: {formData.executorEmail}</Text>
                ) : null}
                {formData.executorPhone ? (
                  <Text style={styles.reviewItem}>Phone: {formData.executorPhone}</Text>
                ) : null}
                {formData.executorIdNumber ? (
                  <Text style={styles.reviewItem}>ID Number: {formData.executorIdNumber}</Text>
                ) : null}
                <Text style={styles.reviewItem}>Relationship: {formData.executorRelationship}</Text>
                {formData.executorAddress ? (
                  <Text style={styles.reviewItem}>Address: {formData.executorAddress}</Text>
                ) : null}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Secondary Contact</Text>
                <Text style={styles.reviewItem}>
                  Name: {`${formData.secondaryContactFirstName} ${formData.secondaryContactSurname}`.trim()}
                </Text>
                <Text style={styles.reviewItem}>Relationship: {formData.secondaryContactRelationship}</Text>
                {formData.secondaryContactEmail ? (
                  <Text style={styles.reviewItem}>Email: {formData.secondaryContactEmail}</Text>
                ) : null}
                {formData.secondaryContactPhone ? (
                  <Text style={styles.reviewItem}>Phone: {formData.secondaryContactPhone}</Text>
                ) : null}
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
                <Ionicons name="checkmark-circle" size={80} color={theme.colors.primary} />
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
              style={[
                styles.nextButton,
                currentStep === 0 && styles.nextButtonFull,
                !isStepValid() && styles.nextButtonDisabled
              ]}
              onPress={nextStep}
              disabled={!isStepValid()}
            >
              <Text style={[
                styles.nextButtonText,
                !isStepValid() && styles.nextButtonTextDisabled
              ]}>
                {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* POPIA Modal */}
      <Modal
        visible={showPopiaModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPopiaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>POPIA Act Consent</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                The Protection of Personal Information Act (POPIA) regulates how MiWill handles
                your personal information. By accepting these terms you consent to MiWill:
                {'\n\n'}
                • Collecting personal, beneficiary, executor, and attorney details strictly for
                succession planning purposes.
                {'\n'}
                • Storing this information securely within South Africa and limiting access to
                authorised parties that you nominate, such as executors and trusted contacts.
                {'\n'}
                • Using your data to deliver estate-related notifications, proof-of-life checks,
                and legal documentation storage services.
                {'\n'}
                • Providing you with the right to request access, rectification, or deletion of
                your information in line with POPIA requirements.
                {'\n\n'}
                MiWill is committed to transparency and will notify you of any changes to how
                your personal information is processed. Your consent enables us to offer a
                compliant, secure digital estate management experience tailored for South Africans.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPopiaModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms of Use Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MiWill Terms of Use</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                These Terms of Use explain the conditions for using MiWill within South Africa:
                {'\n\n'}
                • MiWill provides tools to capture wills, assets, policies, and beneficiary details.
                It does not replace legal advice. You remain responsible for ensuring your will
                meets statutory witnessing and execution requirements.
                {'\n'}
                • All information submitted must be truthful and accurate. You agree to keep your
                login credentials private and to notify MiWill immediately if you suspect
                unauthorised access.
                {'\n'}
                • Uploaded documents, audio, or video files remain your property. You permit MiWill
                to store and process them to support estate administration and share them with
                authorised parties you select.
                {'\n'}
                • MiWill adheres to South African data and estate regulations but cannot guarantee
                the enforceability of documents that are not witnessed or executed according to law.
                {'\n'}
                • Any misuse of the platform, fraudulent activity, or violation of these terms may
                result in suspension and possible legal action.
                {'\n\n'}
                By continuing you acknowledge that you understand these obligations and agree to use
                MiWill responsibly to manage your estate affairs.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
  stepTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  topBackButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  topBackButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
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
  nextButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  nextButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  policyNumberDisplay: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  policyNumberLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.weights.medium as any,
  },
  policyNumberValue: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold as any,
    letterSpacing: 1,
  },
  popiaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  checkboxWrapper: {
    marginRight: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as any,
  },
  popiaText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  popiaLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalScroll: {
    maxHeight: 360,
    marginBottom: theme.spacing.lg,
  },
  modalBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
  },
  modalCloseText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
});

export default RegistrationScreen;
