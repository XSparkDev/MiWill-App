import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import * as ImagePicker from 'expo-image-picker';
import AuthService from '../services/authService';
import UserService from '../services/userService';
import AttorneyService from '../services/attorneyService';
import ExecutorService from '../services/executorService';
import SecondaryContactService from '../services/secondaryContactService';
import NotificationService from '../services/notificationService';
import { formatSAPhoneNumber, isValidSAPhoneNumber, formatPhoneForDisplay } from '../utils/phoneFormatter';

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
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom_years' | 'never' | '';
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
  secondaryContactRelationshipOption: string;
  password: string;
  confirmPassword: string;
  popiaAccepted: boolean;
};

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const customRelationshipInputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

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
    secondaryContactRelationshipOption: '',
    password: '',
    confirmPassword: '',
    popiaAccepted: false,
  });

  const totalSteps = 5;
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
  const [showNeverModal, setShowNeverModal] = useState(false);
  const [executorFlowView, setExecutorFlowView] = useState<'selection' | 'details' | null>(null);
  const [secondaryContactSkipped, setSecondaryContactSkipped] = useState(false);
  const [relationshipDropdownVisible, setRelationshipDropdownVisible] = useState(false);
  useEffect(() => {
    if (currentStep !== 2) {
      setRelationshipDropdownVisible(false);
    }
  }, [currentStep]);

  const relationshipOptions = [
    { label: 'Spouse', value: 'spouse' },
    { label: 'Partner', value: 'partner' },
    { label: 'Fiancé / Fiancée', value: 'fiance' },
    { label: 'Child', value: 'child' },
    { label: 'Parent', value: 'parent' },
    { label: 'Stepparent', value: 'stepparent' },
    { label: 'Stepchild', value: 'stepchild' },
    { label: 'Sibling', value: 'sibling' },
    { label: 'Half-Sibling', value: 'half_sibling' },
    { label: 'Grandparent', value: 'grandparent' },
    { label: 'Grandchild', value: 'grandchild' },
    { label: 'Aunt', value: 'aunt' },
    { label: 'Uncle', value: 'uncle' },
    { label: 'Niece', value: 'niece' },
    { label: 'Nephew', value: 'nephew' },
    { label: 'Cousin', value: 'cousin' },
    { label: 'Guardian', value: 'guardian' },
    { label: 'Ward', value: 'ward' },
    { label: 'Friend', value: 'friend' },
    { label: 'Neighbour', value: 'neighbour' },
    { label: 'Mentor', value: 'mentor' },
    { label: 'Mentee', value: 'mentee' },
    { label: 'Colleague', value: 'colleague' },
    { label: 'Business Partner', value: 'business_partner' },
    { label: 'Employer', value: 'employer' },
    { label: 'Employee', value: 'employee' },
    { label: 'Caregiver', value: 'caregiver' },
    { label: 'Pastor / Spiritual Leader', value: 'pastor' },
    { label: 'Financial Advisor', value: 'financial_advisor' },
    { label: 'Legal Advisor', value: 'legal_advisor' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Therapist', value: 'therapist' },
    { label: 'Coach', value: 'coach' },
    { label: 'Other', value: 'other' },
  ];

  const [showExecutorCancelConfirm, setShowExecutorCancelConfirm] = useState(false);
  const hasExecutorAssigned = formData.hasOwnExecutor || formData.miWillExecutorAccepted;

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
      case 2: // Secondary Contact
        if (secondaryContactSkipped) {
          return true;
        }
        return !!(
          formData.secondaryContactFirstName.trim() &&
          formData.secondaryContactSurname.trim() &&
          formData.secondaryContactRelationship.trim() &&
          formData.secondaryContactEmail.trim() &&
          formData.secondaryContactPhone.trim()
        );
      case 3: // Review
      case 4: // Completion
        return true;
      default:
        return false;
    }
  };

  // Auto-generate policy number on mount
  useEffect(() => {
    const generatePolicyNumber = () => {
      const prefix = 'REF-MW';
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
    if (currentStep === totalSteps - 1) {
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

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep]);

  const phoneFields: (keyof StepData)[] = [
    'phone',
    'attorneyPhone',
    'executorPhone',
    'secondaryContactPhone',
  ];

  const updateFormData = (field: keyof StepData, value: string | boolean | null) => {
    setFormData(prev => {
      let processedValue = value;
      if (typeof value === 'string' && phoneFields.includes(field)) {
        processedValue = formatSAPhoneNumber(value);
      }
      const updated = { ...prev, [field]: processedValue };

      if (
        secondaryContactSkipped &&
        typeof processedValue === 'string' &&
        ['secondaryContactFirstName', 'secondaryContactSurname', 'secondaryContactRelationship', 'secondaryContactEmail', 'secondaryContactPhone'].includes(field) &&
        processedValue.trim()
      ) {
        setSecondaryContactSkipped(false);
      }
      
      // Reset attorneySkipped if user starts filling in attorney fields
      return updated;
    });
  };

  const handleSkipSecondaryContact = () => {
    setSecondaryContactSkipped(true);
    updateFormData('secondaryContactFirstName', '');
    updateFormData('secondaryContactSurname', '');
    updateFormData('secondaryContactRelationship', '');
    updateFormData('secondaryContactRelationshipOption', '');
    updateFormData('secondaryContactEmail', '');
    updateFormData('secondaryContactPhone', '');
    nextStep();
  };

  const handleAddSecondaryContactFromReview = () => {
    setSecondaryContactSkipped(false);
    updateFormData('secondaryContactRelationshipOption', '');
    setCurrentStep(2);
  };

  const prefillRegistrationData = () => {
    const formattedPrimaryPhone = formatSAPhoneNumber('0823456789');
    const formattedExecutorPhone = formatSAPhoneNumber('0712345678');
    const formattedSecondaryPhone = formatSAPhoneNumber('0835551212');

    setSecondaryContactSkipped(false);
    setFormData(prev => ({
      ...prev,
      email: 'demo.user+miwill@example.com',
      phone: formattedPrimaryPhone,
      firstName: 'Demo',
      surname: 'User',
      idNumber: '9001015009087',
      policyNumber: prev.policyNumber || `REF-MW-${Date.now().toString().slice(-8)}-001`,
      profilePicturePath: '',
      address: '123 Demo Street, Cape Town, 8000',
      notificationFrequency: 'monthly',
      customYears: '2',
      customMonths: '0',
      hasOwnAttorney: true,
      attorneySkipped: false,
      attorneyFirstName: 'Lerato',
      attorneySurname: 'Ndlovu',
      attorneyEmail: 'lerato.ndlovu@firm.co.za',
      attorneyPhone: formatSAPhoneNumber('0612345678'),
      attorneyFirm: 'Ndlovu & Partners',
      attorneyAddress: '45 Legal Avenue, Sandton',
      miWillAttorneyAccepted: false,
      hasOwnExecutor: true,
      executorSameAsAttorney: false,
      executorFirstName: 'Thabo',
      executorSurname: 'Mokoena',
      executorEmail: 'thabo.mokoena@example.com',
      executorPhone: formattedExecutorPhone,
      executorIdNumber: '8205055809084',
      executorRelationship: 'Brother',
      executorAddress: '7 Estate Way, Johannesburg',
      miWillExecutorAccepted: false,
      secondaryContactFirstName: 'Naledi',
      secondaryContactSurname: 'Khoza',
      secondaryContactEmail: 'naledi.khoza@example.com',
      secondaryContactPhone: formattedSecondaryPhone,
      secondaryContactRelationship: 'Friend',
      secondaryContactRelationshipOption: 'friend',
      password: '2@XSpark',
      confirmPassword: '2@XSpark',
      popiaAccepted: true,
    }));
  };

  const handleSelectRelationship = (optionValue: string, label: string) => {
    updateFormData('secondaryContactRelationshipOption', optionValue);
    if (optionValue === 'other') {
      updateFormData('secondaryContactRelationship', '');
      setTimeout(() => {
        customRelationshipInputRef.current?.focus();
      }, 150);
    } else {
      updateFormData('secondaryContactRelationship', label);
    }
    setRelationshipDropdownVisible(false);
  };

  const handleExecutorFlowSelection = (hasOwn: boolean) => {
    if (hasOwn) {
      setFormData(prev => ({
        ...prev,
        hasOwnExecutor: true,
        miWillExecutorAccepted: false,
      }));
      setExecutorFlowView('details');
    } else {
      setFormData(prev => ({
        ...prev,
        hasOwnExecutor: false,
        miWillExecutorAccepted: false,
        executorFirstName: '',
        executorSurname: '',
        executorEmail: '',
        executorPhone: '',
        executorIdNumber: '',
        executorRelationship: '',
        executorAddress: '',
      }));
      setShowMiWillExecutorModal(true);
    }
  };

  const isExecutorDetailsValid = (): boolean => {
    return !!(
      formData.executorFirstName.trim() &&
      formData.executorSurname.trim() &&
      formData.executorIdNumber.trim() &&
      formData.executorRelationship.trim() &&
      formData.executorEmail.trim() &&
      formData.executorPhone.trim()
    );
  };

  const handleSaveExecutorDetails = () => {
    if (!isExecutorDetailsValid()) return;
    setFormData(prev => ({
      ...prev,
      hasOwnExecutor: true,
    }));
    setExecutorFlowView(null);
  };

  const handleCancelExecutorDetails = () => {
    setExecutorFlowView('selection');
  };
  const handleCancelExecutorFlow = () => {
    if (hasExecutorAssigned) {
      setShowExecutorCancelConfirm(true);
    } else {
      setExecutorFlowView(null);
    }
  };

  const confirmCancelExecutorFlow = () => {
    setFormData(prev => ({
      ...prev,
      hasOwnExecutor: false,
      miWillExecutorAccepted: false,
      executorFirstName: '',
      executorSurname: '',
      executorEmail: '',
      executorPhone: '',
      executorIdNumber: '',
      executorRelationship: '',
      executorAddress: '',
    }));
    setExecutorFlowView(null);
    setShowExecutorCancelConfirm(false);
  };

  const dismissCancelExecutorFlow = () => {
    setShowExecutorCancelConfirm(false);
  };

  const renderExecutorFlowPage = () => {
    if (!executorFlowView) return null;
    const isSelection = executorFlowView === 'selection';

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.executorPageScroll}
            showsVerticalScrollIndicator={false}
          >
            {isSelection ? (
              <View style={styles.executorSelectionPage}>
                <Text style={styles.executorPageTitle}>Executor Selection</Text>
                <View style={styles.executorIconContainer}>
                  <FontAwesome5 name="file-signature" size={72} color={theme.colors.primary} />
                </View>
                <TouchableOpacity
                  style={styles.executorInfoPill}
                  onPress={() => setShowExecutorInfoModal(true)}
                >
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.executorInfoPillText}>Why do I need an executor?</Text>
                </TouchableOpacity>
                <Text style={styles.executorModalDescription}>
                  Do you have your own executor?
                </Text>
                <TouchableOpacity
                  style={[
                    styles.executorChoiceButton,
                    styles.executorChoiceButtonOutline,
                  ]}
                  onPress={() => handleExecutorFlowSelection(true)}
                >
                  <Text style={styles.executorChoiceButtonOutlineText}>Yes, I have my own executor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.executorChoiceButton,
                    styles.executorChoiceButtonFilled,
                  ]}
                  onPress={() => handleExecutorFlowSelection(false)}
                >
                  <Text style={styles.executorChoiceButtonFilledText}>No, I need an executor</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelExecutorFlow}>
                  <Text style={styles.executorCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.executorDetailsPage}>
                <TouchableOpacity
                  style={styles.executorBackButton}
                  onPress={handleCancelExecutorDetails}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.executorBackButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.executorPageTitle}>Add Executor</Text>
                <Text style={styles.executorModalDescription}>
                  Tell us about the person or professional who will carry out your wishes.
                </Text>

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
                  value={formatPhoneForDisplay(formData.executorPhone)}
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

                <TouchableOpacity
                  style={[
                    styles.executorModalPrimaryButton,
                    !isExecutorDetailsValid() && styles.executorModalPrimaryButtonDisabled,
                  ]}
                  onPress={handleSaveExecutorDetails}
                  disabled={!isExecutorDetailsValid()}
                >
                  <Text style={styles.executorModalPrimaryButtonText}>Save Executor</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelExecutorFlow}>
                  <Text style={styles.executorCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
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

      const nextStepNumber = currentStep + 1;

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
    } else if (!isCompleting) {
      handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    if (isCompleting) return;
    try {
      setIsCompleting(true);
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address before completing registration.');
        setIsCompleting(false);
        return;
      }
      // 1) Create auth account
      const cred = await AuthService.register(normalizedEmail, formData.password);
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
      if (formData.notificationFrequency === 'never') {
        notification_frequency = 'yearly';
      }

      // 3) Create user document with formatted phone
      const formattedPhone = formatSAPhoneNumber(formData.phone.trim());
      await UserService.createUser(uid, {
        email: normalizedEmail,
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

      // 6) Navigate to Upload Will flow for first-time guided setup
      navigation.navigate('UploadWill', {
        firstTimeGuidedFlow: true,
      });
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
      const targetStep = currentStep - 1;

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
              value={formatPhoneForDisplay(formData.phone)}
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

            <TouchableOpacity
              style={[
                styles.frequencyOption,
                formData.notificationFrequency === 'never' && styles.frequencyOptionActive,
              ]}
              onPress={() => {
                updateFormData('notificationFrequency', 'never');
                setShowNeverModal(true);
              }}
            >
              <Ionicons name="moon-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.frequencyText}>Never</Text>
              <Text style={styles.frequencySubtext}>We’ll remind you gently if needed</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 2: {
        const selectedRelationshipOption = relationshipOptions.find(
          option => option.value === formData.secondaryContactRelationshipOption
        );
        const relationshipDisplayText =
          formData.secondaryContactRelationshipOption === 'other' && formData.secondaryContactRelationship
            ? formData.secondaryContactRelationship
            : selectedRelationshipOption?.label || 'Select relationship';

        return (
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepTopBar}>
              <TouchableOpacity
                style={styles.topBackButton}
                onPress={previousStep}
              >
                <Text style={styles.topBackButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkipSecondaryContact}>
                <Text style={styles.skipButtonText}>Add Later</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepTitle}>Emergency contact</Text>
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

            <View
              style={[
                styles.dropdownWrapper,
                relationshipDropdownVisible && styles.dropdownWrapperExpanded,
              ]}
            >
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setRelationshipDropdownVisible(prev => !prev)}
              >
                <Text
                  style={
                    formData.secondaryContactRelationship ||
                    formData.secondaryContactRelationshipOption
                      ? styles.dropdownSelectedText
                      : styles.dropdownPlaceholder
                  }
                >
                  {relationshipDisplayText}
                </Text>
                <Ionicons
                  name={relationshipDropdownVisible ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
              {relationshipDropdownVisible && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    contentContainerStyle={styles.dropdownListContent}
                  >
                    {relationshipOptions.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownOption}
                        onPress={() => handleSelectRelationship(option.value, option.label)}
                      >
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
            </View>
              )}
            </View>

            {formData.secondaryContactRelationshipOption === 'other' && (
            <TextInput
                ref={customRelationshipInputRef}
              style={styles.input}
                placeholder="State Other relationship"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.secondaryContactRelationship}
              onChangeText={(value) => updateFormData('secondaryContactRelationship', value)}
            />
            )}

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
              value={formatPhoneForDisplay(formData.secondaryContactPhone)}
              onChangeText={(value) => updateFormData('secondaryContactPhone', value)}
              keyboardType="phone-pad"
            />
          </Animated.View>
        );
      }


      case 3:
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
                <Text style={styles.reviewItem}>Reference Number: {formData.policyNumber}</Text>
                {formData.address && (
                  <Text style={styles.reviewItem}>Address: {formData.address}</Text>
                )}
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Notification Settings</Text>
                <Text style={styles.reviewItem}>
                  Frequency:{' '}
                  {formData.notificationFrequency === 'custom_years'
                    ? `Every ${formData.customYears} year${parseInt(formData.customYears, 10) > 1 ? 's' : ''}`
                    : formData.notificationFrequency === 'never'
                    ? 'Never (MiWill will check once a year)'
                    : formData.notificationFrequency
                    ? formData.notificationFrequency.charAt(0).toUpperCase() + formData.notificationFrequency.slice(1)
                    : 'Not selected'}
                </Text>
              </View>

                <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Emergency Contact</Text>
                {secondaryContactSkipped ? (
                  <>
                    <Text style={styles.reviewItemNote}>Emergency Contact skipped for now.</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.reviewActionButtonOutline,
                        pressed && styles.reviewActionButtonOutlineActive,
                      ]}
                      onPress={handleAddSecondaryContactFromReview}
                    >
                      {({ pressed }) => (
                        <Text
                          style={[
                            styles.reviewActionButtonOutlineText,
                            pressed && styles.reviewActionButtonOutlineTextActive,
                          ]}
                        >
                          Add Emergency Contact
                        </Text>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 4:
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
            <View style={styles.completionContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={theme.colors.primary} />
              </View>
              <Text style={styles.completionTitle}>All Set!</Text>
              <Text style={styles.completionText}>
                Your MiWill account is ready. You can now draft your Will!
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const mainLayout = (
    <View style={styles.mainWrapper}>
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
                    '#D32F2F', // red
                    theme.colors.primary,
                    '#FFFFFF',
                    '#B0B0B0',
                  ][index % 4],
                  transform: [
                    { translateY: anim.translateY },
                    { translateX: anim.translateX },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
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
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderProgressBar()}
          {renderStep()}

          {currentStep === totalSteps - 1 && (
            <View style={styles.policyNumberDisplaySimple}>
              <Text style={styles.policyNumberLabelSimple}>Your Reference Number:</Text>
              <Text style={styles.policyNumberValueSimple}>{formData.policyNumber}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                styles.nextButtonFull,
                (!isStepValid() || (currentStep === totalSteps - 1 && isCompleting)) &&
                  styles.nextButtonDisabled,
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
                <Text
                  style={[
                    styles.nextButtonText,
                    !isStepValid() && styles.nextButtonTextDisabled,
                  ]}
                >
                {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
              </Text>
              )}
            </TouchableOpacity>
          </View>

          {currentStep >= 1 && currentStep <= 3 && (
            <View style={styles.cancelButtonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRegistration}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
      <TouchableOpacity
        style={styles.prefillButton}
        onPress={prefillRegistrationData}
        accessibilityLabel="Prefill registration form"
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        activeOpacity={0.7}
      >
        <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const modalLayout = (
    <>
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
                  setFormData(prev => ({
                    ...prev,
                    hasOwnExecutor: false,
                    miWillExecutorAccepted: true,
                  }));
                  setReturnToExecutorConsent(false);
                  setShowMiWillExecutorModal(false);
                  setExecutorFlowView(null);
                  setCurrentStep(3);
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

      {/* Never Frequency Modal */}
      <Modal
        visible={showNeverModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowNeverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gentle Reminder</Text>
            <Text style={styles.modalBody}>
              Life happens, we'll still check on you once a year.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNeverModal(false)}
            >
              <Text style={styles.modalCloseText}>OK</Text>
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
    </>
  );

  if (executorFlowView) {
    return (
      <>
        {renderExecutorFlowPage()}
        {modalLayout}
        <Modal
          visible={showExecutorCancelConfirm}
          transparent
          animationType="fade"
          onRequestClose={dismissCancelExecutorFlow}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Remove Executor?</Text>
              <Text style={styles.modalBody}>
                This will clear your current executor selection. Are you sure you want to continue?
              </Text>
              <TouchableOpacity
                style={styles.modalContinueButton}
                onPress={confirmCancelExecutorFlow}
              >
                <Text style={styles.modalContinueText}>Yes, remove executor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={dismissCancelExecutorFlow}
              >
                <Text style={styles.modalBackText}>Keep current executor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      {mainLayout}
      {modalLayout}
    </>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  skipButtonText: {
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
  dropdownWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  dropdownWrapperExpanded: {
    paddingBottom: 160,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  dropdownPlaceholder: {
    color: theme.colors.placeholder,
    fontSize: theme.typography.sizes.md,
  },
  dropdownSelectedText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
  },
  dropdownList: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    opacity: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    zIndex: 20,
    elevation: 4,
    shadowColor: '#00000033',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    maxHeight: 160,
    overflow: 'hidden',
  },
  dropdownListContent: {
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  dropdownScroll: {
    backgroundColor: theme.colors.surface,
  },
  dropdownOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dropdownOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
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
  reviewActionButtonOutline: {
    marginTop: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  reviewActionButtonOutlineActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  reviewActionButtonOutlineText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  reviewActionButtonOutlineTextActive: {
    color: theme.colors.primaryDark || theme.colors.primary,
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
  policyNumberDisplaySimple: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  policyNumberLabelSimple: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    fontWeight: theme.typography.weights.medium as any,
  },
  policyNumberValueSimple: {
    fontSize: theme.typography.sizes.lg,
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
  executorPageScroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  executorSelectionPage: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  executorPageTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
  },
  executorIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  executorInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  executorInfoPillText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  executorPageSubtitle: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
  },
  executorModalSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  executorModalDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  executorChoiceButton: {
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  executorChoiceButtonOutline: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  executorChoiceButtonOutlineText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
  },
  executorChoiceButtonFilled: {
    backgroundColor: theme.colors.primary,
  },
  executorChoiceButtonFilledText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
  },
  executorCancelText: {
    marginTop: theme.spacing.xl,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    textDecorationLine: 'underline',
  },
  executorDetailsPage: {
    flex: 1,
    gap: theme.spacing.md,
  },
  executorBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  executorBackButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  executorModalPrimaryButton: {
    marginTop: theme.spacing.lg,
    alignSelf: 'stretch',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executorModalPrimaryButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  executorModalPrimaryButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
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
  prefillButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#00000044',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default RegistrationScreen;
