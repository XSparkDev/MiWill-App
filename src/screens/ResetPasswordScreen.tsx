import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import AuthService from '../services/authService';
import { resetPasswordStyles as styles } from './ResetPasswordScreen.styles';

interface ResetPasswordScreenProps {
  navigation: any;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSendReset = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPassword(email.trim().toLowerCase());
      setStatusMessage('A reset link has been sent to your email.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.iconWrapper}>
            <Ionicons name="key-outline" size={72} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the email associated with your MiWill account and we'll send you a secure link to reset your password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={theme.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.buttonText} />
            ) : (
              <Text style={styles.sendButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;


