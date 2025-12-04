import React from 'react';
import { View, Text } from 'react-native';
import { onboardingStyles as styles } from './OnboardingScreen.styles';

const OnboardingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding</Text>
      <Text style={styles.subtitle}>Complete your profile setup</Text>
      {/* TODO: Implement Typeform integration */}
    </View>
  );
};
export default OnboardingScreen;

