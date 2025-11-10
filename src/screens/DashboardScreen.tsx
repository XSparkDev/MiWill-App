import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { AssetPolicyModal } from '../components/AssetPolicyModal';
import SideMenu from '../components/SideMenu';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/userService';
import AssetService from '../services/assetService';
import PolicyService from '../services/policyService';
import BeneficiaryService from '../services/beneficiaryService';
import WillService from '../services/willService';
import { UserProfile } from '../types/user';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const [showAssetPolicyModal, setShowAssetPolicyModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assetsCount, setAssetsCount] = useState(0);
  const [policiesCount, setPoliciesCount] = useState(0);
  const [beneficiariesCount, setBeneficiariesCount] = useState(0);
  const [hasWill, setHasWill] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    } else {
      navigation.navigate('Login');
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const profile = await UserService.getUserById(currentUser.uid);
      setUserProfile(profile);

      // Fetch assets count
      const assets = await AssetService.getUserAssets(currentUser.uid);
      setAssetsCount(assets.length);

      // Fetch policies count
      const policies = await PolicyService.getUserPolicies(currentUser.uid);
      setPoliciesCount(policies.length);

      // Fetch beneficiaries count
      const beneficiaries = await BeneficiaryService.getUserBeneficiaries(currentUser.uid);
      setBeneficiariesCount(beneficiaries.length);

      // Check if user has uploaded a will
      const wills = await WillService.getUserWills(currentUser.uid);
      setHasWill(wills.length > 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddAssetPolicy = () => {
    setShowAssetPolicyModal(true);
  };

  const handleAddAsset = () => {
    setShowAssetPolicyModal(false);
    navigation.navigate('AddAsset');
  };

  const handleAddPolicy = () => {
    setShowAssetPolicyModal(false);
    navigation.navigate('AddPolicy');
  };

  const handleAddBeneficiary = () => {
    if (assetsCount === 0 && policiesCount === 0) {
      setToastMessage('You need to have Assets/Policies in order for you to add a beneficiary');
      setShowToast(true);
      return;
    }
    navigation.navigate('AddBeneficiary');
  };

  const handleUploadWill = () => {
    navigation.navigate('UploadWill');
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        loadDashboardData();
      }
    });
    return unsubscribe;
  }, [navigation, currentUser]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Logo, Menu, and Logout */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => setShowSideMenu(true)}
              style={styles.menuButton}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabsCard}>
          <View style={styles.navTabs}>
            <TouchableOpacity style={styles.navTab}>
              <Ionicons name="document-text" size={28} color={theme.colors.primary} />
              <Text style={styles.navTabNumber}>{assetsCount}</Text>
            </TouchableOpacity>

            <View style={styles.navTabCenter}>
              {userProfile?.profile_picture_path ? (
                <Image
                  source={{ uri: userProfile.profile_picture_path }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.centerCircle} />
              )}
            </View>

            <TouchableOpacity style={styles.navTab}>
              <Ionicons name="people" size={28} color={theme.colors.primary} />
              <Text style={styles.navTabNumber}>{beneficiariesCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.assetsPoliciesPill}>
          <Text style={styles.assetsPoliciesText}>Assets | Policies</Text>
        </View>

        {/* User Information */}
        <View style={styles.userInfo}>
          <Text style={styles.infoLabel}>Full Names</Text>
          <Text style={styles.infoValue}>{userProfile?.full_name || '-'}</Text>

          <Text style={styles.infoLabel}>ID Number</Text>
          <Text style={styles.infoValue}>{userProfile?.id_number || '-'}</Text>

          <Text style={styles.infoLabel}>Policy No.</Text>
          <Text style={styles.infoValue}>{userProfile?.policy_number || '-'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddAssetPolicy}>
            <Text style={styles.actionButtonText}>Add Your Assets / Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              (assetsCount === 0 && policiesCount === 0) && styles.actionButtonDisabled
            ]} 
            onPress={handleAddBeneficiary}
            activeOpacity={(assetsCount === 0 && policiesCount === 0) ? 0.6 : 0.8}
          >
            <Text style={[
              styles.actionButtonText,
              (assetsCount === 0 && policiesCount === 0) && styles.actionButtonTextDisabled
            ]}>
              Add Beneficiary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUploadWill}>
            <View style={styles.uploadWillButton}>
              <Text style={styles.actionButtonText}>{hasWill ? 'Edit Will' : 'Upload Will'}</Text>
              {!hasWill && (
                <View style={styles.urgentIndicator}>
                  <Text style={styles.urgentText}>!</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUpdateProfile}>
            <Text style={styles.actionButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Verification Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next Check-in</Text>
              <Text style={styles.statusValue}>In 7 days</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Assets Added</Text>
              <Text style={styles.statusValue}>{assetsCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Policies Added</Text>
              <Text style={styles.statusValue}>{policiesCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Beneficiaries</Text>
              <Text style={styles.statusValue}>{beneficiariesCount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AssetPolicyModal
        visible={showAssetPolicyModal}
        onClose={() => setShowAssetPolicyModal(false)}
        onSelectAsset={handleAddAsset}
        onSelectPolicy={handleAddPolicy}
      />

      <SideMenu
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        navigation={navigation}
      />

      <Toast
        visible={showToast}
        message={toastMessage}
        type="error"
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  logo: {
    width: 100,
    height: 60,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  logoutButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium as any,
  },
  navTabsCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 14,
  },
  navTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
  },
  navTabNumber: {
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.regular as any,
    marginTop: theme.spacing.xs,
  },
  navTabCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.border,
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  assetsPoliciesPill: {
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  assetsPoliciesText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    letterSpacing: 0.6,
  },
  userInfo: {
    paddingHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.regular as any,
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.xxl,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.regular as any,
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  actionButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  uploadWillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  urgentIndicator: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.buttonText,
    fontWeight: theme.typography.weights.bold as any,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  statusBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.semibold as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default DashboardScreen;
