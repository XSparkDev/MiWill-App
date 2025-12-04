import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { notificationPreferencesStyles as styles } from './NotificationPreferencesScreen.styles';

interface NotificationPreferencesScreenProps {
  navigation: any;
}

const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({ navigation }) => {
  const [emailAlerts, setEmailAlerts] = React.useState(true);
  const [pushAlerts, setPushAlerts] = React.useState(true);
  const [executorAlerts, setExecutorAlerts] = React.useState(true);

  const reminderOptions = [
    { label: 'Annually', description: 'We will prompt you once per year to confirm beneficiaries and assets.' },
    { label: 'Every 2 years', description: 'Ideal if your estate does not change frequently.' },
    { label: 'Custom (1 – 5 years)', description: 'Use the registration custom frequency selector to tailor reminders.' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estate reminders</Text>
            <Text style={styles.sectionBody}>
              MiWill nudges you to review beneficiaries, upload new wills and confirm executor details. Choose the cadence that matches your life changes.
            </Text>
            {reminderOptions.map(option => (
              <View key={option.label} style={styles.reminderCard}>
                <Text style={styles.reminderTitle}>{option.label}</Text>
                <Text style={styles.reminderDescription}>{option.description}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Dashboard')}>
              <Ionicons name="settings-outline" size={18} color={theme.colors.buttonText} />
              <Text style={styles.primaryButtonText}>Adjust reminder cadence</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert types</Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Email alerts</Text>
                <Text style={styles.toggleDescription}>Receive summaries of executor updates and beneficiary confirmations.</Text>
              </View>
              <Switch value={emailAlerts} onValueChange={setEmailAlerts} trackColor={{ true: theme.colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Push notifications</Text>
                <Text style={styles.toggleDescription}>Instant alerts for critical changes to your will or linked assets.</Text>
              </View>
              <Switch value={pushAlerts} onValueChange={setPushAlerts} trackColor={{ true: theme.colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Executor alerts</Text>
                <Text style={styles.toggleDescription}>Notify your executor when beneficiaries or asset allocations change.</Text>
              </View>
              <Switch value={executorAlerts} onValueChange={setExecutorAlerts} trackColor={{ true: theme.colors.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips</Text>
            <Text style={styles.sectionBody}>
              • Use shorter cadences when managing business interests or active investments.{'\n'}
              • Encourage executors to enable push alerts so they can assist quickly when changes are made.{'\n'}
              • Keep beneficiary emails up to date to ensure confirmation links reach them.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default NotificationPreferencesScreen;


