import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { documentsContactsStyles as styles } from './DocumentsContactsScreen.styles';

interface DocumentsContactsScreenProps {
  navigation: any;
}

const DocumentsContactsScreen: React.FC<DocumentsContactsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents & Contacts</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Centralise every estate document</Text>
            <Text style={styles.heroSubtitle}>
              MiWill keeps your assets, policies, beneficiaries and executor details in one secure vault so loved ones know exactly where to start.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('UploadWill')}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.buttonText} />
              <Text style={styles.primaryButtonText}>Upload a will or addenda</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assets & Policies</Text>
            <Text style={styles.sectionBody}>
              • Capture every asset or policy so executors can track ownership and beneficiary allocations.{'\n'}
              • Use the inline beneficiary linking on your dashboard to keep track of who inherits what.{'\n'}
              • Remember to add disclaimers for special assets such as jewellery and artwork; MiWill surfaces these notes during the estate review.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('AddAsset')}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Add an asset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('AddPolicy')}
              >
                <Ionicons name="document-attach-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Add a policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficiaries & Contacts</Text>
            <Text style={styles.sectionBody}>
              • Store executor, attorney and secondary contact details so we can send immediate notifications when the will is activated.{'\n'}
              • Beneficiary addresses, ID numbers and contact details are surfaced in the review step to avoid costly estate delays.{'\n'}
              • Use the “Same as attorney” and inline add buttons to speed up onboarding.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddBeneficiary')}
            >
              <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Add beneficiaries</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supporting documents</Text>
            <Text style={styles.sectionBody}>
              Upload supporting PDFs, audio or video wills. MiWill keeps every version available so executors can confirm the most recent legally binding document.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('UploadWill')}
            >
              <Ionicons name="file-tray-full-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Manage stored wills</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default DocumentsContactsScreen;


