import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  onLogout: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, navigation, onLogout }) => {
  const menuItems = [
    {
      id: 'settings',
      icon: 'settings-outline',
      label: 'Settings Overview',
      screen: 'Settings',
    },
    {
      id: 'dashboard',
      icon: 'home-outline',
      label: 'Dashboard',
      screen: 'Dashboard',
    },
    {
      id: 'add-asset',
      icon: 'business-outline',
      label: 'Add an Asset',
      screen: 'AddAsset',
    },
    {
      id: 'add-policy',
      icon: 'shield-half-outline',
      label: 'Add a Policy',
      screen: 'AddPolicy',
    },
    {
      id: 'add-beneficiary',
      icon: 'person-add-outline',
      label: 'Add Beneficiary',
      screen: 'AddBeneficiary',
    },
    {
      id: 'upload-will',
      icon: 'cloud-upload-outline',
      label: 'Upload or edit Will',
      screen: 'UploadWill',
    },
    {
      id: 'account-settings',
      icon: 'settings-outline',
      label: 'Account Settings',
      screen: 'AccountSettings',
    },
    {
      id: 'support',
      icon: 'help-buoy-outline',
      label: 'Help & Support',
      screen: 'Support',
    },
  ];

  const handleMenuItemPress = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              <View style={styles.summaryCard}>
                <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle}>Quick reminders</Text>
                  <Text style={styles.summaryBody}>
                    Review beneficiaries yearly and upload a signed copy of your latest will.
                  </Text>
                </View>
              </View>

              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.screen)}
                >
                  <Ionicons name={item.icon as any} size={24} color={theme.colors.primary} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutMenuItem}
                onPress={() => {
                  onClose();
                  onLogout();
                }}
              >
                <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                <Text style={styles.logoutMenuItemText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    width: '75%',
    maxWidth: 320,
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  menuContent: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  summaryBody: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  menuItemText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  logoutMenuItemText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    marginLeft: theme.spacing.md,
    flex: 1,
    fontWeight: theme.typography.weights.semibold as any,
  },
});

export default SideMenu;

