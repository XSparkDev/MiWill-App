import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { aboutStyles as styles } from './AboutScreen.styles';

interface AboutScreenProps {
  navigation: any;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About MiWill</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="document-lock-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Estate planning for modern families</Text>
            <Text style={styles.heroSubtitle}>
              MiWill helps South Africans create, maintain and share estate instructions in a secure, collaborative workspace.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our mission</Text>
            <Text style={styles.sectionBody}>
              • Simplify estate planning with guided workflows that cover executors, beneficiaries and assets.{'\n'}
              • Honour the POPIA Act by giving users control over how personal information is shared during estate administration.{'\n'}
              • Reduce estate disputes by keeping beneficiary links, disclaimers and will revisions transparent.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product roadmap</Text>
            <Text style={styles.sectionBody}>
              We are actively working on AI-assisted will drafting, document OCR and richer verification so executors can validate instructions faster.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Version information</Text>
            <Text style={styles.sectionBody}>
              App version 1.0.0{'\n'}
              Last major update: POPIA compliance, multi-beneficiary linking and document previews (November 2025).
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credits</Text>
            <Text style={styles.sectionBody}>
              Built with Expo, React Native and Firebase. Icons by Ionicons. Document previews powered by Mozilla&apos;s pdf.js.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AboutScreen;


