import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme.config';
import AuthService from '../services/authService';
import UserService from '../services/userService';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [popiaAccepted, setPopiaAccepted] = useState(false);
  const [showPopiaModal, setShowPopiaModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const lastCheckedEmailRef = useRef<string>('');
  const checkingPopiaRef = useRef<boolean>(false);

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Check if user has already accepted POPIA when email is entered
  // We'll check AsyncStorage cache first, then verify email exists
  useEffect(() => {
    const checkUserPopia = async () => {
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();
      
      // Only check if email is valid and different from last checked
      if (
        !trimmedEmail ||
        !isValidEmail(trimmedEmail) ||
        normalizedEmail === lastCheckedEmailRef.current ||
        checkingPopiaRef.current
      ) {
        return;
      }
      
      checkingPopiaRef.current = true;
      
      try {
        console.log('[LoginScreen] Checking POPIA for email:', trimmedEmail);
        
        // First, check AsyncStorage cache for this email
        const cacheKey = `popia_${normalizedEmail}`;
        const cachedPopia = await AsyncStorage.getItem(cacheKey);
        
        if (cachedPopia === 'true') {
          console.log('[LoginScreen] Found cached POPIA acceptance');
          setPopiaAccepted(true);
          lastCheckedEmailRef.current = normalizedEmail;
          checkingPopiaRef.current = false;
          return;
        }
        
        // Check if the email has sign-in methods (i.e., user exists)
        let signInMethods: string[] = [];
        try {
          signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        } catch (fetchError: any) {
          if (fetchError?.code === 'auth/invalid-email') {
            console.log('[LoginScreen] Firebase reported invalid email, skipping POPIA check.');
            setPopiaAccepted(false);
            lastCheckedEmailRef.current = normalizedEmail;
            checkingPopiaRef.current = false;
            return;
          }
          throw fetchError;
        }
        
        if (signInMethods.length === 0) {
          console.log('[LoginScreen] Email does not exist in system');
          setPopiaAccepted(false);
          lastCheckedEmailRef.current = normalizedEmail;
          checkingPopiaRef.current = false;
          return;
        }
        
        console.log('[LoginScreen] Email exists but no cached POPIA status');
        // Email exists but no cache - keep checkbox unchecked
        // User will need to check it manually, and we'll cache it after login
        setPopiaAccepted(false);
        lastCheckedEmailRef.current = normalizedEmail;
      } catch (err: any) {
        console.error('[LoginScreen] Error checking POPIA:', err);
        // Silently fail - user can still check manually
        setPopiaAccepted(false);
        lastCheckedEmailRef.current = normalizedEmail;
      } finally {
        checkingPopiaRef.current = false;
      }
    };

    const timeoutId = setTimeout(checkUserPopia, 1000);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // Password validation regex (min 8, upper, lower, digit, special)
  const isValidPassword = (pwd: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    return passwordRegex.test(pwd) && !/\s/.test(pwd);
  };

  const handleLogin = async () => {
    setError(null);

    // Validate POPIA acceptance
    if (!popiaAccepted) {
      setError('Please accept the POPIA Act and Terms of Use to continue');
      return;
    }

    // Validate email
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!isValidPassword(password)) {
      setError('Password must be 8+ characters with upper, lower, number and symbol');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await AuthService.login(email.trim(), password);
      
      // After successful login, check if user has already accepted POPIA
      try {
        const userProfile = await UserService.getUserById(userCredential.user.uid);
        if (userProfile) {
          // Cache POPIA status in AsyncStorage for future logins
          const cacheKey = `popia_${email.trim().toLowerCase()}`;
          
          if (userProfile.popia_accepted) {
            // User has already accepted POPIA - cache it
            console.log('[LoginScreen] User has already accepted POPIA, caching status');
            await AsyncStorage.setItem(cacheKey, 'true');
          } else {
            // User hasn't accepted POPIA yet, update it since they just checked it
            console.log('[LoginScreen] Updating user POPIA acceptance');
            await UserService.updateUser(userCredential.user.uid, {
              popia_accepted: true,
              popia_accepted_at: new Date().toISOString(),
            });
            // Cache the acceptance
            await AsyncStorage.setItem(cacheKey, 'true');
          }
        }
      } catch (profileError) {
        console.error('[LoginScreen] Error checking/updating POPIA:', profileError);
        // Continue anyway - non-critical
      }
      
      navigation.navigate('Dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // Navigate to registration flow
    navigation.navigate('Registration');
  };

  const handleResetPassword = () => {
    // TODO: Implement reset password
    console.log('Reset password');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Login Title */}
        <Text style={styles.title}>Login</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* POPIA Checkbox */}
        <View style={styles.popiaContainer}>
          <TouchableOpacity
            onPress={() => setPopiaAccepted(!popiaAccepted)}
            style={styles.checkboxWrapper}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: popiaAccepted }}
          >
            <View style={[styles.checkbox, popiaAccepted && styles.checkboxChecked]}>
              {popiaAccepted && <Text style={styles.checkmark}>✓</Text>}
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

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an Account? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Reset Password Link */}
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.resetPasswordLink}>Reset Password</Text>
        </TouchableOpacity>
      </ScrollView>

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
                The Protection of Personal Information Act (POPIA) governs how MiWill collects,
                stores, and processes your personal data. By proceeding, you acknowledge that:
                {'\n\n'}
                • Your personal details, executor and beneficiary information are collected
                solely for estate-planning purposes.
                {'\n'}
                • We store this information securely and only share it with authorised parties
                such as attorneys, executors, or trusted contacts you nominate.
                {'\n'}
                • You may request access to, correction of, or deletion of your personal
                information at any time via the MiWill support team.
                {'\n'}
                • We comply with South African data protection standards and will notify you
                of any material changes to how your data is handled.
                {'\n\n'}
                Accepting the POPIA terms allows us to provide secure succession planning
                services tailored to South African legal requirements.
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
                These Terms of Use outline the conditions under which you may use the MiWill
                application in South Africa:
                {'\n\n'}
                • MiWill assists with drafting, managing, and storing wills, assets, policies,
                and beneficiary records. It does not replace professional legal advice.
                {'\n'}
                • You are responsible for ensuring the accuracy of all information provided and
                for keeping your login credentials secure.
                {'\n'}
                • Uploaded documents and recordings remain your property. By using MiWill you
                grant us permission to store them securely and make them available to authorised
                parties for estate administration.
                {'\n'}
                • MiWill complies with South African estate planning regulations; however,
                final validation of wills may require witnessing and legal execution outside
                the app.
                {'\n'}
                • Misuse of the service, fraudulent data, or unauthorised access is prohibited
                and may lead to suspension or legal action.
                {'\n\n'}
                Continuing indicates that you understand these conditions and agree to use
                MiWill responsibly within South African legal frameworks.
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.lg,
  },
  logo: {
    width: 180,
    height: 120,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.regular as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBackground,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  loginButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  registerLink: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
  },
  resetPasswordLink: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.regular as any,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  popiaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxHeight: '80%',
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
    maxHeight: 320,
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

export default LoginScreen;
