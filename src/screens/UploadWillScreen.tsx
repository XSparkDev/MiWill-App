import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../config/theme.config';

interface UploadWillScreenProps {
  navigation: any;
}

const UploadWillScreen: React.FC<UploadWillScreenProps> = ({ navigation }) => {
  const [uploadType, setUploadType] = useState<'file' | 'video' | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setUploadType('file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select video');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedVideo(result.assets[0]);
        setUploadType('video');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to record video');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedVideo(result.assets[0]);
        setUploadType('video');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleSave = () => {
    if (uploadType === 'file' && selectedFile) {
      // TODO: Upload file to Firebase Storage
      Alert.alert('Success', 'Will document uploaded successfully');
      navigation.goBack();
    } else if (uploadType === 'video' && selectedVideo) {
      // TODO: Upload video to Firebase Storage
      Alert.alert('Success', 'Will video uploaded successfully');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please select a file or video');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Will</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>How would you like to upload your will?</Text>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={60} color={theme.colors.primary} />
          </View>
          <Text style={styles.subtitle}>
            You can upload a document file or record a video explaining your will
          </Text>

          <TouchableOpacity style={styles.optionButton} onPress={pickDocument}>
            <Ionicons name="document-attach-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Upload Document</Text>
            <Text style={styles.optionSubtext}>PDF, DOC, or DOCX file</Text>
            {selectedFile && (
              <Text style={styles.selectedFile}>{selectedFile.name}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Choose Video</Text>
            <Text style={styles.optionSubtext}>Select from gallery</Text>
            {selectedVideo && (
              <Text style={styles.selectedFile}>Video selected</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={recordVideo}>
            <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Record Video</Text>
            <Text style={styles.optionSubtext}>Record a new video</Text>
            {selectedVideo && uploadType === 'video' && (
              <Text style={styles.selectedFile}>Video recorded</Text>
            )}
          </TouchableOpacity>

          {(selectedFile || selectedVideo) && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color={theme.colors.info} />
              <Text style={styles.infoText}>
                {uploadType === 'file'
                  ? 'Your will document will be securely stored and encrypted.'
                  : 'Your video will be securely stored. Make sure to clearly state who receives what.'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedFile && !selectedVideo) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedFile && !selectedVideo}
          >
            <Text style={styles.saveButtonText}>Upload Will</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  optionText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  optionSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedFile: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium as any,
    marginTop: theme.spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
});

export default UploadWillScreen;

