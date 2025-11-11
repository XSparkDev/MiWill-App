import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import WillService from '../services/willService';

interface UploadWillScreenProps {
  navigation: any;
}

type AiEditorSection = {
  title: string;
  content: string;
};

const UploadWillScreen: React.FC<UploadWillScreenProps> = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [uploadType, setUploadType] = useState<'file' | 'video' | 'audio' | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasExistingWill, setHasExistingWill] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [aiSections, setAiSections] = useState<AiEditorSection[]>([]);
  const [aiCurrentStep, setAiCurrentStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraftUri, setAiDraftUri] = useState<string | null>(null);

  // Check for existing will on mount
  useEffect(() => {
    const checkExistingWill = async () => {
      if (!currentUser) return;
      try {
        const wills = await WillService.getUserWills(currentUser.uid);
        setHasExistingWill(wills.length > 0);
      } catch (error) {
        console.error('Error checking existing will:', error);
      }
    };
    checkExistingWill();
  }, [currentUser]);

  const defaultAiSections: AiEditorSection[] = [
    {
      title: 'Declaration',
      content:
        'I, [Full Name], with ID number [ID Number], residing at [Residential Address], declare this to be my Last Will and Testament. I revoke all prior wills and codicils made by me.',
    },
    {
      title: 'Executor Appointment',
      content:
        'I appoint [Executor Full Name], ID [Executor ID Number], to act as the executor of my estate. If [he/she/they] are unable or unwilling to act, I appoint [Alternate Executor Name] as substitute executor.',
    },
    {
      title: 'Beneficiaries',
      content:
        'I bequeath my assets to the following beneficiaries:\n\n1. [Beneficiary Name] - [Relationship] - [Asset/Percentage]\n2. [Beneficiary Name] - [Relationship] - [Asset/Percentage]\n\nThese allocations are to be administered by my executor in accordance with South African estate law.',
    },
    {
      title: 'Specific Wishes & Signatures',
      content:
        'I wish to include the following specific instructions:\n- [Instruction 1]\n- [Instruction 2]\n\nSIGNED at [Location] on this [Day] day of [Month] [Year], in the presence of the undersigned witnesses.\n\n____________________\nTestator Signature\n\n____________________\nWitness 1 (Signature)\n\n____________________\nWitness 2 (Signature)',
    },
  ];

  const buildSectionsFromContent = (content: string): AiEditorSection[] => {
    if (!content.trim()) {
      return defaultAiSections;
    }

    const blocks = content.split(/\n{2,}/).filter(block => block.trim().length > 0);
    if (blocks.length === 0) {
      return defaultAiSections;
    }

    return blocks.map((block, index) => ({
      title: `Section ${index + 1}`,
      content: block.trim(),
    }));
  };

  const loadDocumentContent = async (uri: string): Promise<string | null> => {
    try {
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return content;
    } catch (error) {
      console.warn('Unable to parse document content, using default template', error);
      return null;
    }
  };

  const openAiAssistant = async () => {
    setAiError(null);
    setAiAssistantVisible(true);
    setAiLoading(true);

    try {
      let sections = defaultAiSections;

      if (selectedFile?.uri) {
        const content = await loadDocumentContent(selectedFile.uri);
        if (content) {
          sections = buildSectionsFromContent(content);
        } else {
          setAiError(
            'We could not extract readable text from the uploaded document. You can still use the template below to craft a new will.'
          );
        }
      }

      setAiSections(sections);
      setAiCurrentStep(0);
    } catch (error: any) {
      console.error('Error initializing AI assistant:', error);
      setAiError(error.message || 'Failed to initialize AI assistant');
      setAiSections(defaultAiSections);
      setAiCurrentStep(0);
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiAssistant = () => {
    setAiAssistantVisible(false);
    setAiError(null);
    setAiLoading(false);
  };

  const updateCurrentAiSection = (text: string) => {
    setAiSections(prev =>
      prev.map((section, index) =>
        index === aiCurrentStep ? { ...section, content: text } : section
      )
    );
  };

  const goToNextAiStep = () => {
    if (aiCurrentStep < aiSections.length - 1) {
      setAiCurrentStep(step => step + 1);
    }
  };

  const goToPreviousAiStep = () => {
    if (aiCurrentStep > 0) {
      setAiCurrentStep(step => step - 1);
    }
  };

  const saveAiDraft = async () => {
    try {
      const combinedContent = aiSections.map(section => section.content.trim()).join('\n\n');
      const fileUri = `${FileSystem.documentDirectory}ai_will_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, combinedContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const aiFile = {
        uri: fileUri,
        name: 'AI_Will_Draft.txt',
        mimeType: 'text/plain',
        size: combinedContent.length,
      };

      setSelectedFile(aiFile);
      setSelectedVideo(null);
      setSelectedAudio(null);
      setUploadType('file');
      setAiDraftUri(fileUri);
      Alert.alert('AI Assistant', 'Your AI-assisted will draft has been saved and is ready to upload.');
      closeAiAssistant();
    } catch (error) {
      console.error('Error saving AI draft:', error);
      Alert.alert('Error', 'Failed to save the AI-assisted will draft.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setUploadType('file');
        setAiDraftUri(null);
        setSelectedVideo(null);
        setSelectedAudio(null);
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
        setSelectedFile(null);
        setSelectedAudio(null);
        setAiDraftUri(null);
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
        setSelectedFile(null);
        setSelectedAudio(null);
        setAiDraftUri(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Audio recording permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Failed to start recording', error);
    }
  };

  const stopRecordingAudio = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setSelectedAudio({ uri, name: 'audio_will.m4a' });
      setUploadType('audio');
      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error('Failed to stop recording', error);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAudio(result.assets[0]);
        setUploadType('audio');
        setSelectedFile(null);
        setSelectedVideo(null);
        setAiDraftUri(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      if (uploadType === 'file' && selectedFile) {
        // TODO: Upload file to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'document',
          document_path: selectedFile.uri,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
        Alert.alert('Success', 'Will document uploaded successfully');
        navigation.goBack();
      } else if (uploadType === 'video' && selectedVideo) {
        // TODO: Upload video to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'video',
          video_path: selectedVideo.uri,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
        Alert.alert('Success', 'Will video uploaded successfully');
        navigation.goBack();
      } else if (uploadType === 'audio' && selectedAudio) {
        // TODO: Upload audio to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'audio',
          audio_path: selectedAudio.uri,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
        Alert.alert('Success', 'Will audio uploaded successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Please select a file, video, or audio');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save will');
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
            You can upload a document, record video or audio explaining your will
          </Text>

          <TouchableOpacity style={[styles.optionButton, styles.aiOptionButton]} onPress={openAiAssistant}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.buttonText} />
              <Text style={styles.aiBadgeText}>Future Feature</Text>
            </View>
            <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Get Assisted by AI</Text>
            <Text style={styles.optionSubtext}>
              Guided editing experience that can read your uploaded will and help you refine it step by step.
            </Text>
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.optionButton} onPress={pickAudio}>
            <Ionicons name="musical-notes-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Choose Audio</Text>
            <Text style={styles.optionSubtext}>Select from files</Text>
            {selectedAudio && uploadType === 'audio' && !isRecording && (
              <Text style={styles.selectedFile}>Audio selected</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, isRecording && styles.optionButtonActive]} 
            onPress={isRecording ? stopRecordingAudio : startRecordingAudio}
          >
            <Ionicons 
              name={isRecording ? "stop-circle" : "mic-outline"} 
              size={40} 
              color={isRecording ? theme.colors.error : theme.colors.primary} 
            />
            <Text style={styles.optionText}>
              {isRecording ? 'Stop Recording' : 'Record Audio'}
            </Text>
            <Text style={styles.optionSubtext}>
              {isRecording ? 'Tap to stop' : 'Record your will'}
            </Text>
            {selectedAudio && !isRecording && uploadType === 'audio' && (
              <Text style={styles.selectedFile}>Audio recorded</Text>
            )}
          </TouchableOpacity>

          {(selectedFile || selectedVideo || selectedAudio) && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color={theme.colors.info} />
              <Text style={styles.infoText}>
                {uploadType === 'file'
                  ? 'Your will document will be securely stored and encrypted.'
                  : uploadType === 'video'
                  ? 'Your video will be securely stored. Make sure to clearly state who receives what.'
                  : 'Your audio will be securely stored. Make sure to clearly state who receives what.'}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedFile && !selectedVideo && !selectedAudio) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedFile && !selectedVideo && !selectedAudio || isRecording}
          >
            <Text style={styles.saveButtonText}>
              {hasExistingWill ? 'Update Will' : 'Upload Will'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={aiAssistantVisible}
        onRequestClose={closeAiAssistant}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalContainer}>
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalHeaderLeft}>
                <Ionicons name="sparkles-outline" size={28} color={theme.colors.primary} />
                <View style={styles.aiModalHeaderText}>
                  <Text style={styles.aiModalTitle}>AI Will Assistant</Text>
                  <Text style={styles.aiModalSubtitle}>
                    Guided editing experience to help refine or draft your will for future AI assistance.
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeAiAssistant} style={styles.aiCloseButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.aiLoadingText}>Preparing your guided editor...</Text>
              </View>
            ) : (
              <>
                {aiError && <Text style={styles.aiErrorText}>{aiError}</Text>}

                <View style={styles.aiStepHeader}>
                  <Text style={styles.aiStepTitle}>
                    {aiSections[aiCurrentStep]?.title || `Section ${aiCurrentStep + 1}`}
                  </Text>
                  <Text style={styles.aiStepCounter}>
                    Step {aiCurrentStep + 1} of {aiSections.length}
                  </Text>
                </View>

                <ScrollView
                  style={styles.aiEditorScroll}
                  contentContainerStyle={styles.aiEditorContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <TextInput
                    style={styles.aiEditorInput}
                    multiline
                    textAlignVertical="top"
                    placeholder="Start drafting your will content here..."
                    placeholderTextColor={theme.colors.placeholder}
                    value={aiSections[aiCurrentStep]?.content || ''}
                    onChangeText={updateCurrentAiSection}
                  />
                </ScrollView>

                <View style={styles.aiControls}>
                  <TouchableOpacity
                    style={[
                      styles.aiControlButton,
                      aiCurrentStep === 0 && styles.aiControlButtonDisabled,
                    ]}
                    onPress={goToPreviousAiStep}
                    disabled={aiCurrentStep === 0}
                  >
                    <Ionicons name="arrow-back" size={20} color={theme.colors.buttonText} />
                    <Text style={styles.aiControlButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.aiControlButton,
                      aiCurrentStep === aiSections.length - 1 && styles.aiControlButtonDisabled,
                    ]}
                    onPress={goToNextAiStep}
                    disabled={aiCurrentStep === aiSections.length - 1}
                  >
                    <Text style={styles.aiControlButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.buttonText} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.aiSaveButton} onPress={saveAiDraft}>
                  <Ionicons name="save-outline" size={22} color={theme.colors.buttonText} />
                  <Text style={styles.aiSaveButtonText}>Save draft & use for upload</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  aiOptionButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionButtonActive: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 1.4,
    marginBottom: theme.spacing.sm,
  },
  aiBadgeText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold as any,
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
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  aiModalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  aiModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  aiModalHeaderText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  aiModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  aiModalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  aiCloseButton: {
    padding: theme.spacing.xs,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  aiLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  aiErrorText: {
    backgroundColor: theme.colors.error + '12',
    color: theme.colors.error,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  aiStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  aiStepTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  aiStepCounter: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  aiEditorScroll: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.inputBackground,
  },
  aiEditorContent: {
    padding: theme.spacing.md,
  },
  aiEditorInput: {
    minHeight: 200,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
  },
  aiControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  aiControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    flex: 1,
  },
  aiControlButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  aiControlButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    marginHorizontal: theme.spacing.xs,
  },
  aiSaveButton: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
  },
  aiSaveButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
});

export default UploadWillScreen;

