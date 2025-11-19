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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import * as ImagePicker from 'expo-image-picker';
import AuthService from '../services/authService';
import UserService from '../services/userService';
import AttorneyService from '../services/attorneyService';
import ExecutorService from '../services/executorService';
import SecondaryContactService from '../services/secondaryContactService';
import NotificationService from '../services/notificationService';
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
  address: string;
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_years' | '';
  customYears: string;
  customMonths: string;
  hasOwnAttorney: boolean | null;
  attorneySkipped: boolean;
  attorneyFirstName: string;
  attorneySurname: string;
  attorneyEmail: string;
  attorneyPhone: string;
  attorneyFirm: string;
  attorneyAddress: string;
  miWillAttorneyAccepted: boolean;
  hasOwnExecutor: boolean | null;
  executorSameAsAttorney: boolean;
  executorFirstName: string;
  executorSurname: string;
  executorEmail: string;
  executorPhone: string;
  executorIdNumber: string;
  executorRelationship: string;
  executorAddress: string;
  miWillExecutorAccepted: boolean;
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
    address: '',
    notificationFrequency: '',
    customYears: '1',
    customMonths: '0',
    hasOwnAttorney: null,
    attorneySkipped: false,
    attorneyFirstName: '',
    attorneySurname: '',
    attorneyEmail: '',
    attorneyPhone: '',
    attorneyFirm: '',
    attorneyAddress: '',
    miWillAttorneyAccepted: false,
    hasOwnExecutor: null,
    executorSameAsAttorney: false,
    executorFirstName: '',
    executorSurname: '',
    executorEmail: '',
    executorPhone: '',
    executorIdNumber: '',
    executorRelationship: '',
    executorAddress: '',
    miWillExecutorAccepted: false,
    secondaryContactFirstName: '',
    secondaryContactSurname: '',
    secondaryContactEmail: '',
    secondaryContactPhone: '',
    secondaryContactRelationship: '',
    password: '',
    confirmPassword: '',
    popiaAccepted: false,
  });

  const totalSteps = 9; // Updated from 7 to 9 (added attorney/executor selection steps)
  const [showMiWillAttorneyModal, setShowMiWillAttorneyModal] = useState(false);
  const [showMiWillExecutorModal, setShowMiWillExecutorModal] = useState(false);
  const [showAttorneyTermsModal, setShowAttorneyTermsModal] = useState(false);
  const [showExecutorTermsModal, setShowExecutorTermsModal] = useState(false);
  const [returnToAttorneyConsent, setReturnToAttorneyConsent] = useState(false);
  const [returnToExecutorConsent, setReturnToExecutorConsent] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showAttorneyInfoModal, setShowAttorneyInfoModal] = useState(false);
  const [showExecutorInfoModal, setShowExecutorInfoModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnims = useRef(
    Array.from({ length: 30 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Simple validators
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Min 8, upper, lower, digit, special, no spaces
  const isValidPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd) && !/\s/.test(pwd);

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      case 2: // Attorney Selection (Yes/No)
        return formData.hasOwnAttorney !== null;
      case 3: // Attorney Information (only if hasOwnAttorney === true)
        if (!formData.hasOwnAttorney) return true; // Skip validation if user chose "No"
        return !!(
          formData.attorneyFirstName.trim() &&
          formData.attorneySurname.trim() &&
          formData.attorneyEmail.trim() &&
          formData.attorneyPhone.trim()
        );
      case 4: // Executor Selection (Yes/No)
        return formData.hasOwnExecutor !== null;
      case 5: // Executor Information
        if (!formData.hasOwnExecutor) return true; // Skip validation if user chose "No"
        return !!(
          formData.executorFirstName.trim() &&
          formData.executorSurname.trim() &&
          formData.executorIdNumber.trim() &&
          formData.executorRelationship.trim() &&
          formData.executorEmail.trim() &&
          formData.executorPhone.trim()
        );
      case 6: // Secondary Contact
        return !!(
          formData.secondaryContactFirstName.trim() &&
          formData.secondaryContactSurname.trim() &&
          formData.secondaryContactRelationship.trim() &&
          formData.secondaryContactEmail.trim() &&
          formData.secondaryContactPhone.trim()
        );
      case 7: // Review
      case 8: // Completion
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

  // Trigger confetti animation when reaching step 8 (completion)
  useEffect(() => {
    if (currentStep === 8) {
      setShowConfetti(true);
      // Animate each confetti piece
      confettiAnims.forEach((anim) => {
        const randomX = (Math.random() - 0.5) * 400;
        const randomRotate = Math.random() * 720;
        const delay = Math.random() * 300;

        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: height + 100,
            duration: 2500 + Math.random() * 1000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: randomX,
            duration: 2500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: randomRotate,
            duration: 2500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2500,
            delay: delay + 1500,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Hide confetti after animation completes
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      setShowConfetti(false);
      // Reset animations
      confettiAnims.forEach(anim => {
        anim.translateY.setValue(-50);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [currentStep]);

  const updateFormData = (field: keyof StepData, value: string | boolean | null) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset attorneySkipped if user starts filling in attorney fields
      if (
        currentStep === 3 &&
        (field === 'attorneyFirstName' || 
         field === 'attorneySurname' || 
         field === 'attorneyEmail' || 
         field === 'attorneyPhone') &&
        value && 
        typeof value === 'string' &&
        value.trim()
      ) {
        updated.attorneySkipped = false;
      }
      
      return updated;
    });
  };

  const handleAttorneySelection = (hasOwn: boolean) => {
    setFormData(prev => ({
      ...prev,
      hasOwnAttorney: hasOwn,
      miWillAttorneyAccepted: hasOwn ? false : true,
    }));

    if (hasOwn) {
      setTimeout(() => nextStep(), 0);
    } else {
      setShowMiWillAttorneyModal(true);
    }
  };

  const handleExecutorSelection = (hasOwn: boolean) => {
    setFormData(prev => ({
      ...prev,
      hasOwnExecutor: hasOwn,
      miWillExecutorAccepted: hasOwn ? false : true,
    }));

    if (hasOwn) {
      setTimeout(() => nextStep(), 0);
    } else {
      setShowMiWillExecutorModal(true);
    }
  };

  const handleExecutorSameAsAttorney = () => {
    if (!formData.hasOwnAttorney || formData.attorneySkipped) {
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

      // Handle attorney selection step
      if (currentStep === 2) {
        if (formData.hasOwnAttorney === false && !formData.miWillAttorneyAccepted) {
          // Show MiWill attorney modal
          setShowMiWillAttorneyModal(true);
          return;
        }
      }

      // Handle executor selection step
      if (currentStep === 4) {
        if (formData.hasOwnExecutor === false && !formData.miWillExecutorAccepted) {
          // Show MiWill executor modal
          setShowMiWillExecutorModal(true);
          return;
        }
      }

      // Calculate next step (skip attorney info if user chose MiWill attorney)
      let nextStepNumber = currentStep + 1;
      
      // Skip attorney info step (3) if user chose MiWill attorney
      if (currentStep === 2 && formData.hasOwnAttorney === false) {
        nextStepNumber = 4; // Skip to executor selection
      }
      
      // Skip executor info step (5) if user chose MiWill executor
      if (currentStep === 4 && formData.hasOwnExecutor === false) {
        nextStepNumber = 6; // Skip to secondary contact
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
        setCurrentStep(nextStepNumber);
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
      if (!isCompleting) {
        // Complete registration
        handleCompleteRegistration();
      }
    }
  };

  const handleCompleteRegistration = async () => {
    if (isCompleting) return;
    try {
      setIsCompleting(true);
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
        custom_days = years * 365 + months * 30;
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
        address: formData.address.trim(),
        notification_frequency,
        custom_frequency_days: custom_days,
        popia_accepted: formData.popiaAccepted,
        has_own_attorney: formData.hasOwnAttorney || false,
        has_own_executor: formData.hasOwnExecutor || false,
        miwill_attorney_accepted: formData.miWillAttorneyAccepted,
        miwill_executor_accepted: formData.miWillExecutorAccepted,
        attorney_notification_dismissed: false,
        executor_notification_dismissed: false,
      } as any);

      // 4) Create linked records
      if (
        formData.hasOwnAttorney &&
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

      if (
        formData.hasOwnExecutor &&
        (formData.executorFirstName.trim() || formData.executorSurname.trim())
      ) {
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

      // 5) Create notifications for MiWill attorney/executor assignments
      if (formData.miWillAttorneyAccepted && !formData.hasOwnAttorney) {
        try {
          await NotificationService.createAttorneyNotification(uid);
          console.log('[Registration] Attorney notification created for user:', uid);
        } catch (notifError) {
          console.error('[Registration] Failed to create attorney notification:', notifError);
        }
      }

      if (formData.miWillExecutorAccepted && !formData.hasOwnExecutor) {
        try {
          await NotificationService.createExecutorNotification(uid);
          console.log('[Registration] Executor notification created for user:', uid);
        } catch (notifError) {
          console.error('[Registration] Failed to create executor notification:', notifError);
        }
      }

      // 6) Navigate to dashboard
      navigation.navigate('Dashboard');
    } catch (e: any) {
      console.error('Registration error:', e);
      
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
    } finally {
      setIsCompleting(false);
    }
  };

  const closeAttorneyTermsModal = () => {
    setShowAttorneyTermsModal(false);
    if (returnToAttorneyConsent) {
      setShowMiWillAttorneyModal(true);
      setReturnToAttorneyConsent(false);
    }
  };

  const closeExecutorTermsModal = () => {
    setShowExecutorTermsModal(false);
    if (returnToExecutorConsent) {
      setShowMiWillExecutorModal(true);
      setReturnToExecutorConsent(false);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      let targetStep = currentStep - 1;

      // Skip attorney info step if user chose MiWill attorney
      if (currentStep === 4 && formData.hasOwnAttorney === false) {
        targetStep = 2; // Go back to attorney selection
      }

      // Skip executor info step if user chose MiWill executor
      if (currentStep === 6 && formData.hasOwnExecutor === false) {
        targetStep = 4; // Go back to executor selection
      }

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
        setCurrentStep(targetStep);
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

  const handleCancelRegistration = () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel registration? All progress will be lost.',
      [
        { text: 'Continue Registration', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
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
              placeholder="Address"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
            />

            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.placeholder}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

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
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
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
        // Attorney Selection Step
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Attorney Selection</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="gavel" size={60} color={theme.colors.primary} />
              <TouchableOpacity
                style={styles.infoIconButton}
                onPress={() => setShowAttorneyInfoModal(true)}
              >
                <Ionicons name="information-circle-outline" size={28} color={theme.colors.primary} />
                <Text style={styles.infoIconText}>What does an attorney do?</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepSubtitle}>Do you have your own attorney?</Text>

            <TouchableOpacity
              style={[
                styles.selectionButton,
                formData.hasOwnAttorney === true && styles.selectionButtonOutlineActive,
              ]}
              onPress={() => handleAttorneySelection(true)}
            >
              <Text style={[
                styles.selectionButtonText,
                formData.hasOwnAttorney === true && styles.selectionButtonTextActive
              ]}>
                Yes, I have my own attorney
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectionButton,
                styles.selectionButtonFilled,
                formData.hasOwnAttorney === false && styles.selectionButtonFilledActive,
              ]}
              onPress={() => handleAttorneySelection(false)}
            >
              <Text style={styles.selectionButtonTextFilled}>
                No, I need an attorney
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 3:
        // Attorney Information (only shown if hasOwnAttorney === true)
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Attorney Information</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="gavel" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Tell us about your attorney</Text>

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

      case 4:
        // Executor Selection Step
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Executor Selection</Text>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="file-signature" size={50} color={theme.colors.primary} />
              <TouchableOpacity
                style={styles.infoIconButton}
                onPress={() => setShowExecutorInfoModal(true)}
              >
                <Ionicons name="information-circle-outline" size={28} color={theme.colors.primary} />
                <Text style={styles.infoIconText}>Why do I need an executor?</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepSubtitle}>Do you have your own executor?</Text>

            <TouchableOpacity
              style={[
                styles.selectionButton,
                formData.hasOwnExecutor === true && styles.selectionButtonOutlineActive,
              ]}
              onPress={() => handleExecutorSelection(true)}
            >
              <Text style={[
                styles.selectionButtonText,
                formData.hasOwnExecutor === true && styles.selectionButtonTextActive
              ]}>
                Yes, I have my own executor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectionButton,
                styles.selectionButtonFilled,
                formData.hasOwnExecutor === false && styles.selectionButtonFilledActive,
              ]}
              onPress={() => handleExecutorSelection(false)}
            >
              <Text style={styles.selectionButtonTextFilled}>
                No, I need an executor
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 5:
        // Executor Information (only shown if hasOwnExecutor === true)
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Executor Information</Text>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="file-signature" size={50} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Tell us about your executor</Text>

            {formData.hasOwnAttorney && (
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

      case 6:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
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

      case 7:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Review Your Information</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.stepSubtitle}>Please review your details before continuing</Text>

            <ScrollView style={styles.reviewContainer} nestedScrollEnabled>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Personal Information</Text>
                {formData.profilePicturePath && (
                  <View style={styles.reviewProfileImage}>
                    <Image
                      source={{ uri: formData.profilePicturePath }}
                      style={styles.reviewAvatar}
                    />
                  </View>
                )}
                <Text style={styles.reviewItem}>Name: {formData.firstName} {formData.surname}</Text>
                <Text style={styles.reviewItem}>Email: {formData.email}</Text>
                <Text style={styles.reviewItem}>Phone: {formData.phone}</Text>
                <Text style={styles.reviewItem}>ID Number: {formData.idNumber}</Text>
                <Text style={styles.reviewItem}>Policy Number: {formData.policyNumber}</Text>
                {formData.address && (
                  <Text style={styles.reviewItem}>Address: {formData.address}</Text>
                )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Notification Settings</Text>
                <Text style={styles.reviewItem}>
                  Frequency: {formData.notificationFrequency === 'custom_years' 
                    ? `Every ${formData.customYears} year${parseInt(formData.customYears) > 1 ? 's' : ''}`
                    : formData.notificationFrequency.charAt(0).toUpperCase() + formData.notificationFrequency.slice(1)}
                </Text>
              </View>

              {formData.hasOwnAttorney ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Attorney Information</Text>
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
                    <Text style={styles.reviewItem}>Law Firm: {formData.attorneyFirm}</Text>
                  ) : null}
                  {formData.attorneyAddress ? (
                    <Text style={styles.reviewItem}>Address: {formData.attorneyAddress}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Attorney Information</Text>
                  <Text style={styles.reviewItem}>
                    <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} /> MiWill Partner
                  </Text>
                  <Text style={styles.reviewItemNote}>
                    You can appoint your own attorney anytime from the Dashboard
                  </Text>
                </View>
              )}

              {formData.hasOwnExecutor ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Executor Information</Text>
                  <Text style={styles.reviewItem}>
                    Name: {`${formData.executorFirstName} ${formData.executorSurname}`.trim()}
                  </Text>
                  <Text style={styles.reviewItem}>Relationship: {formData.executorRelationship}</Text>
                  {formData.executorEmail ? (
                    <Text style={styles.reviewItem}>Email: {formData.executorEmail}</Text>
                  ) : null}
                  {formData.executorPhone ? (
                    <Text style={styles.reviewItem}>Phone: {formData.executorPhone}</Text>
                  ) : null}
                  {formData.executorIdNumber ? (
                    <Text style={styles.reviewItem}>ID Number: {formData.executorIdNumber}</Text>
                  ) : null}
                  {formData.executorAddress ? (
                    <Text style={styles.reviewItem}>Address: {formData.executorAddress}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Executor Information</Text>
                  <Text style={styles.reviewItem}>
                    <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} /> MiWill Partner
                  </Text>
                  <Text style={styles.reviewItemNote}>
                    You can appoint your own executor anytime from the Dashboard
                  </Text>
                </View>
              )}

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

      case 8:
        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.completionContainer}>
              <Image
                source={require('../../assets/logo1.png')}
                style={styles.completionLogoBig}
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
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  left: `${(index % 10) * 10 + 5}%`,
                  backgroundColor: [
                    theme.colors.primary,
                    theme.colors.success,
                    theme.colors.info,
                    '#FFD700',
                    '#FF6B9D',
                    '#C9A3FF',
                  ][index % 6],
                  transform: [
                    { translateY: anim.translateY },
                    { translateX: anim.translateX },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }) },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}
        </View>
      )}
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

          {currentStep !== 2 && currentStep !== 4 && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  styles.nextButtonFull,
                  (!isStepValid() || (currentStep === totalSteps - 1 && isCompleting)) && styles.nextButtonDisabled
                ]}
                onPress={nextStep}
                disabled={!isStepValid() || (currentStep === totalSteps - 1 && isCompleting)}
              >
                {currentStep === totalSteps - 1 && isCompleting ? (
                  <View style={styles.nextButtonLoading}>
                    <ActivityIndicator size="small" color={theme.colors.buttonText} />
                    <Text style={styles.nextButtonLoadingText}>Completing...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.nextButtonText,
                    !isStepValid() && styles.nextButtonTextDisabled
                  ]}>
                    {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {currentStep >= 1 && currentStep <= 7 && (
            <View style={styles.cancelButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelRegistration}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MiWill Attorney Confirmation Modal */}
      <Modal
        visible={showMiWillAttorneyModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMiWillAttorneyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MiWill Partner Attorney</Text>
            <Text style={styles.modalBody}>
              By selecting "No," you agree to have a qualified and vetted Legal Personnel from our MiWill Partner network assigned to manage your estate. This service is provided at no additional cost and ensures your affairs are handled professionally.
            </Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={() => updateFormData('miWillAttorneyAccepted', !formData.miWillAttorneyAccepted)}
                style={styles.checkboxWrapper}
              >
                <View style={[styles.checkbox, formData.miWillAttorneyAccepted && styles.checkboxChecked]}>
                  {formData.miWillAttorneyAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.checkboxTextRow}>
                <Text style={styles.checkboxText}>I will use MiWill Partner attorneys</Text>
                <TouchableOpacity
                  onPress={() => {
                    setReturnToAttorneyConsent(true);
                    setShowMiWillAttorneyModal(false);
                    setShowAttorneyTermsModal(true);
                  }}
                >
                  <Text style={styles.termsLink}>(Terms)</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.modalContinueButton,
                !formData.miWillAttorneyAccepted && styles.modalContinueButtonDisabled
              ]}
              onPress={() => {
                if (formData.miWillAttorneyAccepted) {
                  setReturnToAttorneyConsent(false);
                  setShowMiWillAttorneyModal(false);
                  nextStep();
                }
              }}
              disabled={!formData.miWillAttorneyAccepted}
            >
              <Text style={styles.modalContinueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setReturnToAttorneyConsent(false);
                setShowMiWillAttorneyModal(false);
                updateFormData('hasOwnAttorney', null);
                updateFormData('miWillAttorneyAccepted', false);
              }}
            >
              <Text style={styles.modalBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MiWill Executor Confirmation Modal */}
      <Modal
        visible={showMiWillExecutorModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMiWillExecutorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MiWill Executor Service</Text>
            <Text style={styles.modalBody}>
              By selecting "No," you agree to have a qualified and trusted professional from MiWill's Executor network assigned to execute your will. This ensures your estate is managed responsibly and according to your documented wishes.
            </Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={() => updateFormData('miWillExecutorAccepted', !formData.miWillExecutorAccepted)}
                style={styles.checkboxWrapper}
              >
                <View style={[styles.checkbox, formData.miWillExecutorAccepted && styles.checkboxChecked]}>
                  {formData.miWillExecutorAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.checkboxTextRow}>
                <Text style={styles.checkboxText}>I will use MiWill Executors</Text>
                <TouchableOpacity
                  onPress={() => {
                    setReturnToExecutorConsent(true);
                    setShowMiWillExecutorModal(false);
                    setShowExecutorTermsModal(true);
                  }}
                >
                  <Text style={styles.termsLink}>(Terms)</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.modalContinueButton,
                !formData.miWillExecutorAccepted && styles.modalContinueButtonDisabled
              ]}
              onPress={() => {
                if (formData.miWillExecutorAccepted) {
                  setReturnToExecutorConsent(false);
                  setShowMiWillExecutorModal(false);
                  nextStep();
                }
              }}
              disabled={!formData.miWillExecutorAccepted}
            >
              <Text style={styles.modalContinueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setReturnToExecutorConsent(false);
                setShowMiWillExecutorModal(false);
                updateFormData('hasOwnExecutor', null);
                updateFormData('miWillExecutorAccepted', false);
              }}
            >
              <Text style={styles.modalBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Attorney Terms Modal */}
      <Modal
        visible={showAttorneyTermsModal}
        animationType="slide"
        transparent
        onRequestClose={closeAttorneyTermsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MiWill Partner Attorney Terms</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                • MiWill will assign a vetted attorney who is admitted to the High Court of South Africa and specialises in estate law.
                {'\n'}
                • The attorney’s mandate covers estate planning, drafting, and execution support for your MiWill documentation.
                {'\n'}
                • Any additional legal services outside of MiWill’s scope (litigation, business law, etc.) are agreed directly between you and the attorney.
                {'\n'}
                • You retain the right to terminate MiWill’s attorney appointment at any time and appoint your own attorney.
                {'\n'}
                • MiWill remains a coordinating platform and is not responsible for professional negligence by the appointed attorney.
                {'\n'}
                • All personal information shared with the attorney is handled under POPIA and MiWill’s privacy policy.
                {'\n\n'}
                By accepting, you authorise MiWill to assign an attorney under these terms.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeAttorneyTermsModal}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Executor Terms Modal */}
      <Modal
        visible={showExecutorTermsModal}
        animationType="slide"
        transparent
        onRequestClose={closeExecutorTermsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MiWill Executor Service Terms</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                • MiWill will appoint a professional executor who is qualified to administer estates under South African law.
                {'\n'}
                • The executor will manage reporting to the Master of the High Court, debt settlement, tax submissions, and distribution of assets.
                {'\n'}
                • Statutory executor fees (up to 3.5% of gross estate + VAT) may apply and will be disclosed to your next of kin.
                {'\n'}
                • You may revoke MiWill’s executor appointment and nominate your own executor at any time via the app.
                {'\n'}
                • MiWill facilitates the appointment but is not liable for executor negligence; executors operate as independent fiduciaries.
                {'\n'}
                • All information provided to the executor is governed by POPIA and MiWill’s privacy standards.
                {'\n\n'}
                By accepting, you authorise MiWill to assign an executor under these terms.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeExecutorTermsModal}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Attorney Info Modal */}
      <Modal
        visible={showAttorneyInfoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAttorneyInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why an Attorney Matters</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                Your attorney, or a MiWill attorney ensures your will and estate instructions are legally sound, up to date, and enforceable.
                They advise on asset protection, draft or update legal documents, and act as your legal representative if disputes arise.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAttorneyInfoModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Executor Info Modal */}
      <Modal
        visible={showExecutorInfoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowExecutorInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Executor Responsibilities</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                Your executor or a MiWill executor carries out your wishes after you pass away. They secure assets, pay outstanding debts and taxes,
                file required reports, and distribute inheritances to your beneficiaries. Choosing a trusted executor ensures
                your estate is administered smoothly and according to your instructions.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowExecutorInfoModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                • Storing this information securely within South Africa and sharing it with
                authorised MiWill Partners, including attorneys, executors, and XS Card Partners,
                as well as trusted contacts that you nominate.
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
                • MiWill complies with South African estate planning regulations. MiWill will
                auto-transcribe your will in a legally structured manner with confirmation from
                the authorised Partners and will be sent to you for signing and return (one copy
                will be stored in the MiWill Partner Vault and a copy remains with you).
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
  cancelButtonContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium as any,
    textDecorationLine: 'underline',
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
    gap: theme.spacing.sm,
  },
  infoIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  infoIconText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium as any,
  },
  stepSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    textAlign: 'center',
  },
  selectionQuestion: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold as any,
    marginBottom: theme.spacing.lg,
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
  passwordInputWrapper: {
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  passwordInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
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
  selectionButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  selectionButtonOutlineActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  selectionButtonFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectionButtonFilledActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  selectionButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  selectionButtonTextActive: {
    color: theme.colors.primary,
  },
  selectionButtonTextFilled: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
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
  reviewItemNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic' as any,
    marginTop: theme.spacing.xs / 2,
    marginBottom: theme.spacing.xs,
  },
  reviewProfileImage: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reviewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
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
  completionLogoBig: {
    width: 200,
    height: 140,
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
  nextButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  nextButtonLoadingText: {
    fontSize: theme.typography.sizes.md,
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
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    fontWeight: theme.typography.weights.medium as any,
  },
  policyNumberValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
    letterSpacing: 0.5,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  checkboxText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  checkboxTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  termsLink: {
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
  modalContinueButton: {
    alignSelf: 'stretch',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalContinueButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  modalContinueText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  modalBackButton: {
    alignSelf: 'stretch',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  modalBackText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
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
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default RegistrationScreen;
