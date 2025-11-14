// MiWill Theme Configuration - Based on brand identity
export const theme = {
  colors: {
    // Primary teal colors from MiWill brand (darker shade)
    primary: '#287587', // Darker teal
    primaryDark: '#1F5C69',
    primaryLight: '#3D8DA1',
    
    // Neutral colors
    secondary: '#7D8A96',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceLight: '#FAFBFC',
    
    // Text colors
    text: '#2C3E50',
    textSecondary: '#7D8A96',
    textLight: '#B8C1CC',
    placeholder: '#C4CCD4',
    
    // Status colors
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Border colors
    border: '#E5EAF0',
    borderLight: '#F0F3F7',
    
    // Input colors
    inputBorder: '#287587',
    inputBackground: '#FFFFFF',
    inputFocus: '#287587',
    
    // Button colors
    buttonPrimary: '#287587',
    buttonPrimaryHover: '#1F5C69',
    buttonSecondary: '#F0F3F7',
    buttonText: '#FFFFFF',
    
    // Shadow
    shadow: 'rgba(40, 117, 135, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  typography: {
    fontFamily: 'Montserrat',
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      huge: 40,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#287587',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#287587',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#287587',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
} as const;

export default theme;

