import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { supportStyles as styles } from './SupportScreen.styles';

interface SupportScreenProps {
  navigation: any;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
  const handleEmail = () => {
    Linking.openURL('mailto:support@miwill.co.za?subject=MiWill%20Support%20Request');
  };

  const handleCall = () => {
    Linking.openURL('tel:+27123456789');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="help-buoy-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>We are here for you</Text>
            <Text style={styles.heroSubtitle}>
              Executors and families often need clarity quickly. Reach us via email, phone or the knowledge base.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact MiWill</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              <TouchableOpacity onPress={handleEmail}>
                <Text style={styles.linkText}>support@miwill.co.za</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              <TouchableOpacity onPress={handleCall}>
                <Text style={styles.linkText}>+27 12 345 6789</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionBody}>
              Support hours: Monday – Friday, 08:00 to 17:00 (SAST). After-hours emergencies are routed to the estate duty on-call team.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Knowledge base</Text>
            <Text style={styles.sectionBody}>
              • Preparing documents for upload (PDF, audio or video).{'\n'}
              • How to link beneficiaries to a new asset or policy.{'\n'}
              • Estate administration checklist for executors.
            </Text>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="open-outline" size={18} color={theme.colors.buttonText} />
              <Text style={styles.primaryButtonText}>Open help centre (coming soon)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Release notes</Text>
            <Text style={styles.sectionBody}>
              Subscribe to product updates to be notified about new features like AI will drafting, advanced verification and 2FA.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SupportScreen;


