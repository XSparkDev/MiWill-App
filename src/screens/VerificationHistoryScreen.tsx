import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { verificationHistoryStyles as styles } from './VerificationHistoryScreen.styles';

interface VerificationHistoryScreenProps {
  navigation: any;
}

const mockTimeline = [
  {
    date: '12 Nov 2025',
    title: 'Secondary contact verified',
    description: 'Verification email accepted by Thandi Mkhize (secondary contact).',
  },
  {
    date: '05 Oct 2025',
    title: 'Executor confirmation',
    description: 'Executor Musa Dlamini confirmed receipt of will and asset listings.',
  },
  {
    date: '18 Sep 2025',
    title: 'Beneficiary ID check',
    description: 'ID number confirmed for beneficiary Zola Ndlovu (policy allocation 40%).',
  },
];

const VerificationHistoryScreen: React.FC<VerificationHistoryScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification History</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Track every approval</Text>
            <Text style={styles.heroSubtitle}>
              Executors rely on clear, timestamped confirmation trails. MiWill records each action automatically.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {mockTimeline.map(item => (
              <View key={item.title} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{item.date}</Text>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Export verification log (coming soon)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What gets logged?</Text>
            <Text style={styles.sectionBody}>
              • Executor acceptance and document downloads.{'\n'}
              • Beneficiary email confirmations and ID matches.{'\n'}
              • When assets, policies or wills are updated or deleted.{'\n'}
              • POPIA consent renewals (auto-updated at sign-in).
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default VerificationHistoryScreen;


