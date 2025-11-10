import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import UserService from '../services/userService';
import { UserProfile } from '../types/user';

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await UserService.getUserById(currentUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const refreshProfile = async () => {
    await loadProfile();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;

    try {
      await UserService.updateUser(currentUser.uid, updates);
      await loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const value: UserContextType = {
    userProfile,
    loading,
    refreshProfile,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

