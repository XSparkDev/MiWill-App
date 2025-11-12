import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import WillService from '../services/willService';
import { WillInformation } from '../types/will';
let WebView: any = null;
try {
  // Lazily require so native dependency isn't mandatory in all environments
  // eslint-disable-next-line global-require
  const webviewModule = require('react-native-webview');
  WebView = webviewModule.WebView || webviewModule.default;
} catch (error) {
  WebView = null;
}

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
  const [existingWills, setExistingWills] = useState<WillInformation[]>([]);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [aiSections, setAiSections] = useState<AiEditorSection[]>([]);
  const [aiCurrentStep, setAiCurrentStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // Removed aiDraftUri as it's not used
  const [previewWill, setPreviewWill] = useState<WillInformation | null>(null);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadExistingWills = useCallback(async () => {
    if (!currentUser) return;
    try {
      const wills = await WillService.getUserWills(currentUser.uid);
      setExistingWills(wills);
      setHasExistingWill(wills.length > 0);
    } catch (error) {
      console.error('Error loading existing wills:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadExistingWills();
  }, [loadExistingWills]);

  // Cleanup audio when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.unloadAsync().catch((error) => {
          console.error('Error unloading audio on cleanup:', error);
        });
      }
    };
  }, [audioSound]);

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
      const content = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: 'utf8' as any,
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
      const fs = FileSystem as any;
      const fileUri = `${fs.documentDirectory || fs.cacheDirectory}ai_will_${Date.now()}.txt`;
      await FileSystemLegacy.writeAsStringAsync(fileUri, combinedContent, {
        encoding: 'utf8' as any,
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
      Alert.alert('AI Assistant', 'Your AI-assisted will draft has been saved and is ready to upload.');
      closeAiAssistant();
    } catch (error) {
      console.error('Error saving AI draft:', error);
      Alert.alert('Error', 'Failed to save the AI-assisted will draft.');
    }
  };

  const generateWillName = (): string => {
    const totalCount = existingWills.length;
    return `MiWill ${totalCount + 1}`;
  };

  const getWillDisplayName = (will: WillInformation) => {
    if (will.will_document_name) return will.will_document_name;
    if (will.will_title) return will.will_title;
    const path =
      will.document_path || will.video_path || will.audio_path || will.will_document_url;
    if (!path) return 'Untitled Will';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Untitled Will';
  };

  const getWillSourcePath = (will: WillInformation) => {
    if (will.document_path) return will.document_path;
    if (will.video_path) return will.video_path;
    if (will.audio_path) return will.audio_path;
    if (will.will_document_url) return will.will_document_url;
    return null;
  };

  const handleOpenExistingWill = async (will: WillInformation) => {
    const path = getWillSourcePath(will);
    if (!path) {
      Alert.alert('Unavailable', 'No viewable path is stored for this will.');
      return;
    }
    
    // Stop any currently playing audio
    if (audioSound) {
      try {
        await audioSound.unloadAsync();
      } catch (error) {
        console.error('Error unloading audio:', error);
      }
      setAudioSound(null);
      setIsPlaying(false);
    }
    
    setPreviewWill(will);
  };

  const handleClosePreview = async () => {
    // Stop audio if playing
    if (audioSound) {
      try {
        await audioSound.unloadAsync();
      } catch (error) {
        console.error('Error unloading audio:', error);
      }
      setAudioSound(null);
      setIsPlaying(false);
    }
    setPreviewWill(null);
  };

  const handlePlayPauseAudio = async () => {
    if (!previewWill || previewWill.will_type !== 'audio') return;
    
    const path = getWillSourcePath(previewWill);
    if (!path) return;

    try {
      if (!audioSound) {
        // Load and play audio
        const { sound } = await Audio.Sound.createAsync(
          { uri: path },
          { shouldPlay: true }
        );
        setAudioSound(sound);
        setIsPlaying(true);
        
        sound.setOnPlaybackStatusUpdate((status) => {
          setPlaybackStatus(status);
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        // Toggle play/pause
        if (isPlaying) {
          await audioSound.pauseAsync();
          setIsPlaying(false);
        } else {
          await audioSound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio file.');
    }
  };

  const getWillTypeIcon = (will: WillInformation) => {
    switch (will.will_type) {
      case 'video':
        return 'videocam-outline';
      case 'audio':
        return 'musical-notes-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatTimestamp = (value: Date | string | undefined) => {
    if (!value) return 'Unknown';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
  };

  const formatTime = (millis: number): string => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadWill = async (will: WillInformation) => {
    try {
      const sourcePath = getWillSourcePath(will);
      if (!sourcePath) {
        Alert.alert('Error', 'No file path available for this will.');
        return;
      }

      const fileName = getWillDisplayName(will);
      const fileExtension = will.will_type === 'document' 
        ? (sourcePath.split('.').pop() || 'pdf')
        : will.will_type === 'video' 
        ? 'mp4' 
        : 'm4a';
      
      const fullFileName = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`;

      // Check if file is already local (starts with file:// or is a local path)
      const isLocalFile = sourcePath.startsWith('file://') || 
                         sourcePath.startsWith('/') || 
                         !sourcePath.startsWith('http://') && !sourcePath.startsWith('https://');

      let fileUri: string;

      if (isLocalFile) {
        // File is already local, check if it exists
        try {
          const fileInfo = await FileSystemLegacy.getInfoAsync(sourcePath);
          if (!fileInfo.exists) {
            Alert.alert('Error', 'File not found. It may have been moved or deleted.');
            return;
          }
          fileUri = sourcePath;
        } catch (error) {
          console.error('Error checking local file:', error);
          Alert.alert('Error', 'Unable to access the file.');
          return;
        }
      } else {
        // File is remote, download it
        try {
          // Get cache directory
          const fs = FileSystem as any;
          const cacheDir = fs.cacheDirectory || fs.documentDirectory;
          
          if (!cacheDir) {
            Alert.alert('Error', 'Unable to access file system cache.');
            return;
          }

          const localUri = `${cacheDir}${fullFileName}`;
          
          // Download the file using legacy API
          const downloadResult = await FileSystemLegacy.downloadAsync(sourcePath, localUri);
          
          if (downloadResult.status !== 200) {
            throw new Error(`Download failed with status ${downloadResult.status}`);
          }
          
          fileUri = downloadResult.uri;
        } catch (error: any) {
          console.error('Error downloading file:', error);
          Alert.alert('Error', error.message || 'Failed to download the file.');
          return;
        }
      }

      // Share the file using native share sheet
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: will.will_type === 'document' 
            ? 'application/pdf' 
            : will.will_type === 'video' 
            ? 'video/mp4' 
            : 'audio/m4a',
          dialogTitle: `Save ${fullFileName}`,
        });
      } else {
        Alert.alert(
          'Download Complete',
          `File is ready: ${fullFileName}\n\nSharing is not available on this device.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error downloading will:', error);
      Alert.alert('Error', error.message || 'Failed to download the will file.');
    }
  };

  const handleDeleteExistingWill = (will: WillInformation) => {
    Alert.alert(
      'Delete Will',
      'Are you sure you want to permanently delete this will?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WillService.deleteWill(will.will_id);
              setExistingWills(prev => {
                const next = prev.filter(item => item.will_id !== will.will_id);
                setHasExistingWill(next.length > 0);
                return next;
              });
              Alert.alert('Deleted', 'Will removed successfully.');
            } catch (error) {
              console.error('Error deleting will:', error);
              Alert.alert('Error', 'Failed to delete the selected will.');
            }
          },
        },
      ]
    );
  };

  const renderExistingWillCard = (will: WillInformation) => (
    <View key={will.will_id} style={styles.existingWillCard}>
      <TouchableOpacity
        style={styles.existingWillDownloadIcon}
        onPress={() => handleDownloadWill(will)}
        activeOpacity={0.7}
      >
        <Ionicons name="download-outline" size={22} color={theme.colors.primary} />
      </TouchableOpacity>
      <View style={styles.existingWillHeader}>
        <View style={styles.existingWillIcon}>
          <Ionicons name={getWillTypeIcon(will)} size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.existingWillInfo}>
          <Text style={styles.existingWillName}>{getWillDisplayName(will)}</Text>
          <Text style={styles.existingWillMeta}>
            Type: {will.will_type.charAt(0).toUpperCase() + will.will_type.slice(1)}
          </Text>
          <Text style={styles.existingWillMeta}>
            Updated: {formatTimestamp(will.last_updated)}
          </Text>
        </View>
      </View>
      <View style={styles.existingWillActions}>
        <TouchableOpacity
          style={styles.existingWillActionButton}
          onPress={() => handleOpenExistingWill(will)}
        >
          <Ionicons name="open-outline" size={20} color={theme.colors.buttonText} />
          <Text style={styles.existingWillActionText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.existingWillActionButton, styles.existingWillDeleteButton]}
          onPress={() => handleDeleteExistingWill(will)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.buttonText} />
          <Text style={styles.existingWillActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        const asset = result.assets[0];
        const willName = generateWillName();
        const extension = asset.name?.split('.').pop() || 'pdf';
        setSelectedFile({ ...asset, name: `${willName}.${extension}` });
        setUploadType('file');
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
        const asset = result.assets[0];
        const willName = generateWillName();
        setSelectedVideo({ ...asset, fileName: `${willName}.mp4` });
        setUploadType('video');
        setSelectedFile(null);
        setSelectedAudio(null);
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
        const asset = result.assets[0];
        const willName = generateWillName();
        setSelectedVideo({ ...asset, fileName: `${willName}.mp4` });
        setUploadType('video');
        setSelectedFile(null);
        setSelectedAudio(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    }
  };

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

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
      const willName = generateWillName();
      
      setSelectedAudio({ uri, name: `${willName}.m4a` });
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
        const asset = result.assets[0];
        const willName = generateWillName();
        const extension = asset.name?.split('.').pop() || 'm4a';
        setSelectedAudio({ ...asset, name: `${willName}.${extension}` });
        setUploadType('audio');
        setSelectedFile(null);
        setSelectedVideo(null);
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
        const willName = selectedFile.name || generateWillName();
      // TODO: Upload file to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'document',
          document_path: selectedFile.uri,
          will_document_name: willName,
          will_title: willName,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
      Alert.alert('Success', 'Will document uploaded successfully');
        await loadExistingWills();
        setSelectedFile(null);
        setSelectedVideo(null);
        setSelectedAudio(null);
        setUploadType(null);
    } else if (uploadType === 'video' && selectedVideo) {
        const willName = selectedVideo.fileName || generateWillName();
      // TODO: Upload video to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'video',
          video_path: selectedVideo.uri,
          will_document_name: willName,
          will_title: willName,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
      Alert.alert('Success', 'Will video uploaded successfully');
        await loadExistingWills();
        setSelectedVideo(null);
        setSelectedFile(null);
        setSelectedAudio(null);
        setUploadType(null);
      } else if (uploadType === 'audio' && selectedAudio) {
        const willName = selectedAudio.name || generateWillName();
        // TODO: Upload audio to Firebase Storage
        await WillService.createWill({
          user_id: currentUser.uid,
          will_type: 'audio',
          audio_path: selectedAudio.uri,
          will_document_name: willName,
          will_title: willName,
          status: 'active',
          is_verified: false,
          last_updated: new Date(),
        });
        Alert.alert('Success', 'Will audio uploaded successfully');
        await loadExistingWills();
        setSelectedAudio(null);
        setSelectedFile(null);
        setSelectedVideo(null);
        setUploadType(null);
    } else {
        Alert.alert('Error', 'Please select a file, video, or audio');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save will');
    }
  };

  const renderMainContent = () => (
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

          {existingWills.length > 0 && (
            <View style={styles.existingWillSection}>
              <Text style={styles.existingWillSectionTitle}>
                {existingWills.length > 1 ? 'Existing Wills' : 'Current Will'}
              </Text>
              {existingWills.map(renderExistingWillCard)}
            </View>
          )}

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
            <View style={styles.recordingContainer}>
              <Ionicons 
                name={isRecording ? "stop-circle" : "mic-outline"} 
                size={40} 
                color={isRecording ? theme.colors.error : theme.colors.primary} 
              />
              {isRecording && (
                <Animated.View 
                  style={[
                    styles.recordingIndicator,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={styles.recordingPulse} />
                </Animated.View>
              )}
            </View>
            <Text style={styles.optionText}>
              {isRecording ? 'Stop Recording' : 'Record Audio'}
            </Text>
            <Text style={styles.optionSubtext}>
              {isRecording ? 'Recording in progress...' : 'Record your will'}
            </Text>
            {selectedAudio && !isRecording && uploadType === 'audio' && (
              <Text style={styles.selectedFile}>{selectedAudio.name || 'Audio recorded'}</Text>
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
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderMainContent()}

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

      <Modal
        visible={!!previewWill}
        animationType="slide"
        onRequestClose={handleClosePreview}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={handleClosePreview}
              style={styles.previewCloseButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>
              {previewWill ? getWillDisplayName(previewWill) : 'Preview'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {previewWill && (() => {
            const path = getWillSourcePath(previewWill);
            if (!path) {
              return (
                <View style={styles.previewErrorContainer}>
                  <Text style={styles.previewErrorText}>File path not available</Text>
                </View>
              );
            }

            switch (previewWill.will_type) {
              case 'audio':
                return (
                  <View style={styles.previewContent}>
                    <View style={styles.audioPlayerContainer}>
                      <Ionicons 
                        name="musical-notes" 
                        size={80} 
                        color={theme.colors.primary} 
                        style={styles.audioIcon}
                      />
                      <Text style={styles.audioFileName}>
                        {getWillDisplayName(previewWill)}
                      </Text>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPauseAudio}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause-circle' : 'play-circle'}
                          size={64}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                      {playbackStatus?.isLoaded && (
                        <Text style={styles.audioTime}>
                          {formatTime(playbackStatus.positionMillis)} / {formatTime(playbackStatus.durationMillis || 0)}
                        </Text>
                      )}
                    </View>
                  </View>
                );

              case 'video':
                return (
                  <View style={styles.previewContent}>
                    <Video
                      source={{ uri: path }}
                      style={styles.videoPlayer}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>
                );

              case 'document':
              default:
                if (WebView) {
                  return (
                    <WebView
                      source={{ uri: path }}
                      style={styles.previewWebView}
                      startInLoadingState
                      renderLoading={() => (
                        <View style={styles.previewLoading}>
                          <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                      )}
                    />
                  );
                } else {
                  return (
                    <View style={styles.previewErrorContainer}>
                      <Text style={styles.previewErrorText}>
                        WebView is not available. Please download the file to view it.
                      </Text>
                    </View>
                  );
                }
            }
          })()}
        </SafeAreaView>
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
  existingWillSection: {
    width: '100%',
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background,
  },
  existingWillSectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  existingWillCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  existingWillDownloadIcon: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
    padding: theme.spacing.xs,
  },
  existingWillHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  existingWillIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  existingWillInfo: {
    flex: 1,
  },
  existingWillName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginBottom: theme.spacing.xs / 1.5,
  },
  existingWillMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 1.5,
  },
  existingWillActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  existingWillActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  existingWillDeleteButton: {
    backgroundColor: theme.colors.error,
  },
  existingWillActionText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    marginLeft: theme.spacing.xs / 1.2,
  },
  recordingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    opacity: 0.6,
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
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  previewCloseButton: {
    padding: theme.spacing.xs,
  },
  previewTitle: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    flex: 1,
    textAlign: 'center',
  },
  previewContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  previewWebView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  previewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  previewErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  previewErrorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  audioPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  audioIcon: {
    marginBottom: theme.spacing.xl,
  },
  audioFileName: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold as any,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  playButton: {
    marginBottom: theme.spacing.lg,
  },
  audioTime: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default UploadWillScreen;

