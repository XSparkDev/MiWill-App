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
}

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, navigation }) => {
  const menuItems = [
    {
      id: 'settings',
      icon: 'settings-outline',
      label: 'Settings',
      screen: 'Settings',
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notification Preferences',
      screen: 'Settings',
    },
    {
      id: 'verification',
      icon: 'checkmark-circle-outline',
      label: 'Verification History',
      screen: 'Settings',
    },
    {
      id: 'documents',
      icon: 'document-text-outline',
      label: 'My Documents',
      screen: 'Settings',
    },
    {
      id: 'executor',
      icon: 'people-outline',
      label: 'Executor & Contacts',
      screen: 'Settings',
    },
    {
      id: 'security',
      icon: 'lock-closed-outline',
      label: 'Security & Privacy',
      screen: 'Settings',
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: 'Help & Support',
      screen: 'Settings',
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      label: 'About MiWill',
      screen: 'Settings',
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
});

export default SideMenu;

