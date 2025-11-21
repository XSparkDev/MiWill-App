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
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { theme } from '../config/theme.config';
import { useAuth } from '../contexts/AuthContext';
import WillService from '../services/willService';
import { WillInformation } from '../types/will';
import { WebView } from 'react-native-webview';
import { shouldShowModal, setDontShowAgain } from '../utils/modalPreferences';

interface UploadWillScreenProps {
  navigation: any;
  route?: any;
}

type AiEditorSection = {
  title: string;
  content: string;
};

const PDF_HTML_WRAPPER = (base64Content: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
    <style>
      * {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: #111111;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      }
      #viewer {
        width: 100%;
        min-height: 100%;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      canvas {
        width: 100% !important;
        height: auto !important;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        background-color: #ffffff;
      }
      #loader {
        color: #ffffff;
        font-size: 16px;
        margin-top: 24px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div id="viewer">
      <div id="loader">Loading PDF viewer...</div>
    </div>
    <script>
      (function() {
        const viewer = document.getElementById('viewer');
        const loader = document.getElementById('loader');
        
        function loadPDFJS() {
          return new Promise(function(resolve, reject) {
            if (window.pdfjsLib) {
              resolve(window.pdfjsLib);
              return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = function() {
              if (window.pdfjsLib) {
                resolve(window.pdfjsLib);
              } else {
                reject(new Error('PDF.js library not found after loading'));
              }
            };
            script.onerror = function() {
              reject(new Error('Failed to load PDF.js script'));
            };
            document.head.appendChild(script);
          });
        }
        
        function renderPDF(pdfjsLib) {
          try {
            const pdfBase64 = '${base64Content}';
            const raw = atob(pdfBase64);
            const uint8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) {
              uint8Array[i] = raw.charCodeAt(i);
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            pdfjsLib.getDocument({ data: uint8Array }).promise.then(function(pdf) {
              loader.innerText = '';
              const totalPages = pdf.numPages;

              const renderPage = function(pageNumber) {
                pdf.getPage(pageNumber).then(function(page) {
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  viewer.appendChild(canvas);

                  const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                  };

                  page.render(renderContext).promise.then(function() {
                    if (pageNumber < totalPages) {
                      renderPage(pageNumber + 1);
                    } else {
                      loader.style.display = 'none';
                    }
                  }).catch(function(err) {
                    console.error('Render error for page ' + pageNumber, err);
                    loader.innerText = 'Failed to render page ' + pageNumber + '.';
                  });
                }).catch(function(err) {
                  console.error('Page load error for page ' + pageNumber, err);
                  loader.innerText = 'Failed to load page ' + pageNumber + '.';
                });
              };

              renderPage(1);
            }).catch(function(error) {
              console.error('PDF load error', error);
              loader.innerText = 'Failed to load PDF document: ' + (error.message || 'Unknown error');
            });
          } catch (error) {
            console.error('PDF processing error', error);
            loader.innerText = 'Error processing PDF: ' + (error.message || 'Unknown error');
          }
        }
        
        loadPDFJS()
          .then(function(pdfjsLib) {
            renderPDF(pdfjsLib);
          })
          .catch(function(error) {
            console.error('PDF.js loading error', error);
            loader.innerText = 'Unable to load PDF viewer: ' + (error.message || 'Unknown error');
          });
      })();
    </script>
  </body>
</html>
`;

const UploadWillScreen: React.FC<UploadWillScreenProps> = ({ navigation, route }) => {
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
  const [documentSource, setDocumentSource] = useState<{ html?: string; uri?: string } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showSupersedeModal, setShowSupersedeModal] = useState(false);
  const [_pendingSave, setPendingSave] = useState<{ type: 'file' | 'video' | 'audio'; data: any } | null>(null);
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [transcribeWillType, setTranscribeWillType] = useState<'document' | 'video' | 'audio' | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSource, setPreviewSource] = useState<{ type: 'file' | 'video' | 'audio'; uri: string; name?: string } | null>(null);
  const [previewDocumentSource, setPreviewDocumentSource] = useState<{ html?: string; uri?: string } | null>(null);
  const [previewDocumentLoading, setPreviewDocumentLoading] = useState(false);

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
        'I bequeath my Assets to the following beneficiaries:\n\n1. [Beneficiary Name] - [Relationship] - [Asset/Percentage]\n2. [Beneficiary Name] - [Relationship] - [Asset/Percentage]\n\nThese allocations are to be administered by my executor in accordance with South African estate law.',
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

  const [showFirstTimeGuidedModal, setShowFirstTimeGuidedModal] = useState(false);
  const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false);
  const [guidedFlowActive, setGuidedFlowActive] = useState(false);
  const guidedWillPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkAndShowWelcomeModal = async () => {
      if (route?.params?.firstTimeGuidedFlow) {
        // Only show during first-time registration flow
        const shouldShow = await shouldShowModal('UPLOAD_WILL_WELCOME');
        if (shouldShow) {
          setShowFirstTimeGuidedModal(true);
          setGuidedFlowActive(true);
        }
        navigation.setParams?.({ firstTimeGuidedFlow: false });
      }
    };
    checkAndShowWelcomeModal();
  }, [route?.params?.firstTimeGuidedFlow, navigation]);

  useEffect(() => {
    if (guidedFlowActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(guidedWillPulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(guidedWillPulseAnim, {
            toValue: 0.97,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      guidedWillPulseAnim.setValue(1);
    }
  }, [guidedFlowActive, guidedWillPulseAnim]);

  const handleGuidedWill = () => {
    setGuidedFlowActive(false);
    navigation.navigate('AddAsset', {
      showFirstTimeExplainer: true,
      fromGuidedWill: true,
    });
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
      closeAiAssistant();
      
      // Automatically show preview
      setPreviewSource({ type: 'file', uri: aiFile.uri, name: aiFile.name });
      setShowPreviewModal(true);
      // Text files won't have PDF preview, but try anyway
      await loadPreviewDocument(aiFile.uri);
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

    setDocumentSource(null);
    setDocumentLoading(false);

    if (will.will_type === 'document') {
      setDocumentLoading(true);

      try {
        const extension = path.split('.').pop()?.toLowerCase() || 'pdf';
        const supportedTypes = ['pdf'];

        if (!supportedTypes.includes(extension)) {
          Alert.alert(
            'Preview Not Supported',
            'This document type cannot be previewed in-app. Please download it to view.',
            [{ text: 'OK' }]
          );
          return;
        }

        const isRemoteFile = path.startsWith('http://') || path.startsWith('https://');
        let localPath = path;

        if (isRemoteFile) {
          try {
            const fs = FileSystem as any;
            const cacheDir = fs.cacheDirectory || fs.documentDirectory;
            if (!cacheDir) {
              throw new Error('Unable to access cache directory.');
            }
            const fileName = path.split('/').pop() || `${will.will_id}.${extension}`;
            const downloadUri = `${cacheDir}preview_${fileName}`;
            const downloadResult = await FileSystem.downloadAsync(path, downloadUri);
            if (downloadResult.status !== 200) {
              throw new Error(`Failed to download document (status ${downloadResult.status}).`);
            }
            localPath = downloadResult.uri;
          } catch (downloadError: any) {
            console.error('Error downloading remote document:', downloadError);
            Alert.alert(
              'Preview Error',
              'Failed to download the document for preview. Please try again or download it manually.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        const fileInfo = await FileSystemLegacy.getInfoAsync(localPath);
        if (!fileInfo.exists) {
          Alert.alert('Error', 'Document file not found.');
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fileInfo.size && fileInfo.size > maxSize) {
          Alert.alert(
            'File Too Large',
            'This file is too large to preview in-app. Please download it to view.',
            [{ text: 'OK' }]
          );
          return;
        }

        const base64 = await FileSystemLegacy.readAsStringAsync(localPath, {
          encoding: 'base64' as any,
        });

        if (!base64 || base64.length === 0) {
          throw new Error('Unable to read document content.');
        }

        const sanitizedBase64 = base64.replace(/(\r\n|\n|\r)/gm, '');
        const pdfHtml = PDF_HTML_WRAPPER(sanitizedBase64);
        setDocumentSource({ html: pdfHtml });
      } catch (error: any) {
        console.error('Error preparing document for preview:', error);
        Alert.alert(
          'Preview Error',
          error.message || 'Failed to prepare the document for preview.',
          [{ text: 'OK' }]
        );
        return;
      } finally {
        setDocumentLoading(false);
      }
    } else {
      setDocumentSource(null);
    }

    // For all will types (document, audio, video), use the modal preview
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
    setDocumentSource(null);
    setDocumentLoading(false);
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

  const handleTranscribeClick = (willType: 'document' | 'video' | 'audio') => {
    setTranscribeWillType(willType);
    setShowTranscribeModal(true);
  };

  const renderExistingWillCard = (will: WillInformation) => (
    <View key={will.will_id} style={styles.existingWillCard}>
      <View style={styles.existingWillIconActions}>
        <TouchableOpacity
          style={styles.existingWillTopIcon}
          onPress={() => handleDownloadWill(will)}
          activeOpacity={0.7}
        >
          <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.existingWillTopIcon}
          onPress={() => handleTranscribeClick(will.will_type as 'document' | 'video' | 'audio')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
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
        const videoData = { ...asset, fileName: `${willName}.mp4` };
        setSelectedVideo(videoData);
        setUploadType('video');
        setSelectedFile(null);
        setSelectedAudio(null);
        
        // Automatically show preview
        setPreviewSource({ type: 'video', uri: videoData.uri, name: videoData.fileName });
        setShowPreviewModal(true);
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
      
      if (!uri) {
        Alert.alert('Error', 'Failed to get recording URI');
        return;
      }
      
      const willName = generateWillName();
      const audioData = { uri, name: `${willName}.m4a` };
      setSelectedAudio(audioData);
      setUploadType('audio');
      setRecording(null);
      
      // Automatically show preview
      setPreviewSource({ type: 'audio', uri: audioData.uri, name: audioData.name });
      setShowPreviewModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error('Failed to stop recording', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    // Check if there's an existing will - if so, show supersede modal
    if (existingWills.length > 0) {
    if (uploadType === 'file' && selectedFile) {
        setPendingSave({ type: 'file', data: selectedFile });
        setShowSupersedeModal(true);
        return;
      } else if (uploadType === 'video' && selectedVideo) {
        setPendingSave({ type: 'video', data: selectedVideo });
        setShowSupersedeModal(true);
        return;
      } else if (uploadType === 'audio' && selectedAudio) {
        setPendingSave({ type: 'audio', data: selectedAudio });
        setShowSupersedeModal(true);
        return;
      }
    }

    // No existing will, proceed normally
    await performSave();
  };

  const performSave = async () => {
    if (!currentUser) return;

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

  const confirmSupersede = async () => {
    setShowSupersedeModal(false);
    await performSave();
    setPendingSave(null);
  };

  const cancelSupersede = () => {
    setShowSupersedeModal(false);
    setPendingSave(null);
  };

  const loadPreviewDocument = async (uri: string) => {
    setPreviewDocumentLoading(true);
    setPreviewDocumentSource(null);

    try {
      const extension = uri.split('.').pop()?.toLowerCase() || 'pdf';
      
      if (extension !== 'pdf') {
        // For non-PDF files, don't load preview
        setPreviewDocumentLoading(false);
        return;
      }

      const fileInfo = await FileSystemLegacy.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Document file not found.');
        setPreviewDocumentLoading(false);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        Alert.alert(
          'File Too Large',
          'This file is too large to preview. It will be uploaded securely.',
          [{ text: 'OK' }]
        );
        setPreviewDocumentLoading(false);
        return;
      }

      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      if (!base64 || base64.length === 0) {
        throw new Error('Unable to read document content.');
      }

      const sanitizedBase64 = base64.replace(/(\r\n|\n|\r)/gm, '');
      const pdfHtml = PDF_HTML_WRAPPER(sanitizedBase64);
      setPreviewDocumentSource({ html: pdfHtml });
    } catch (error: any) {
      console.error('Error preparing document for preview:', error);
      // Don't show alert, just fail silently and show fallback UI
    } finally {
      setPreviewDocumentLoading(false);
    }
  };

  const handlePreviewSelected = async () => {
    if (selectedFile) {
      setPreviewSource({ type: 'file', uri: selectedFile.uri, name: selectedFile.name });
      setShowPreviewModal(true);
      // Load document preview for PDFs
      await loadPreviewDocument(selectedFile.uri);
    } else if (selectedVideo) {
      setPreviewSource({ type: 'video', uri: selectedVideo.uri, name: selectedVideo.fileName });
      setShowPreviewModal(true);
    } else if (selectedAudio) {
      setPreviewSource({ type: 'audio', uri: selectedAudio.uri, name: selectedAudio.name });
      setShowPreviewModal(true);
    }
  };

  const handleCancelUpload = () => {
    Alert.alert(
      'Cancel Upload',
      'Are you sure you want to cancel? Your selected file will be removed.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setSelectedFile(null);
            setSelectedVideo(null);
            setSelectedAudio(null);
            setUploadType(null);
            setShowPreviewModal(false);
            setPreviewSource(null);
          },
        },
      ]
    );
  };

  const closePreviewModal = async () => {
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
    setShowPreviewModal(false);
    setPreviewSource(null);
    setPreviewDocumentSource(null);
    setPreviewDocumentLoading(false);
  };

  const renderMainContent = () => (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Draft Will</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>How would you like to draft your Will?</Text>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={60} color={theme.colors.primary} />
          </View>
          <Text style={styles.subtitle}>
            You can follow Guided Will, record video or audio explaining your Will
          </Text>

          {existingWills.length > 0 && (
            <View style={styles.existingWillSection}>
              <Text style={styles.existingWillSectionTitle}>
                {existingWills.length > 1 ? 'Existing Wills' : 'Current Will'}
              </Text>
              {existingWills.map(renderExistingWillCard)}
            </View>
          )}

          <Animated.View
            style={guidedFlowActive ? { transform: [{ scale: guidedWillPulseAnim }] } : undefined}
          >
            <TouchableOpacity
              style={[styles.optionButton, styles.aiOptionButton]}
              onPress={handleGuidedWill}
            >
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.buttonText} />
                <Text style={styles.aiBadgeText}>Recommended</Text>
              </View>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary} />
              <Text style={styles.optionText}>Draft Will</Text>
              <Text style={styles.optionSubtext}>
                (A guided Process to draft your Will.)
              </Text>
              <View style={styles.guidedStepsContainer}>
                <Text style={styles.guidedStepItem}>1. Add your assets</Text>
                <Text style={styles.guidedStepItem}>2. Add beneficiaries</Text>
                <Text style={styles.guidedStepItem}>3. Link beneficiaries to Assets</Text>
                <Text style={styles.guidedStepItem}>4. Auto-Will output</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.optionButton} onPress={recordVideo}>
            <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionText}>Record Video</Text>
            <Text style={styles.optionSubtext}>Record a new video</Text>
            {selectedVideo && uploadType === 'video' && (
              <Text style={styles.selectedFile}>Video recorded</Text>
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
              {isRecording ? 'Recording in progress...' : 'Record your Will'}
            </Text>
            {selectedAudio && !isRecording && uploadType === 'audio' && (
              <Text style={styles.selectedFile}>{selectedAudio.name || 'Audio recorded'}</Text>
            )}
          </TouchableOpacity>

          {(selectedFile || selectedVideo || selectedAudio) && (
            <View style={styles.infoBox}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.infoText}>
                {uploadType === 'file'
                  ? 'Document selected and ready to upload. Your Will document is securely stored and encrypted.'
                  : uploadType === 'video'
                  ? 'Video selected and ready to upload. Your video will be securely stored. Make sure it clearly states who receives what.'
                  : 'Audio selected and ready to upload. Your audio will be securely stored. Make sure it clearly states who receives what.'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.optionButton, styles.aiOptionButton, styles.aiOptionButtonDisabled]}
            onPress={openAiAssistant}
            disabled
          >
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
        </ScrollView>

        <View style={styles.footer}>
          {(selectedFile || selectedVideo || selectedAudio) && (
            <View style={styles.footerButtonRow}>
              <TouchableOpacity
                style={styles.previewAgainButton}
                onPress={handlePreviewSelected}
              >
                <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.previewAgainButtonText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleSave}
                disabled={isRecording}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.buttonText} />
                <Text style={styles.saveButtonText}>
                  {hasExistingWill ? 'Update Will' : 'Upload Will'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {(!selectedFile && !selectedVideo && !selectedAudio) && (
            <TouchableOpacity
              style={[styles.saveButton, styles.saveButtonDisabled]}
              disabled
            >
              <Text style={styles.saveButtonText}>
                Continue
              </Text>
            </TouchableOpacity>
          )}
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
                    Guided editing experience to help refine or draft your Will for future AI assistance.
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
                    placeholder="Start drafting your Will content here..."
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
        visible={showFirstTimeGuidedModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFirstTimeGuidedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="sparkles" size={32} color={theme.colors.primary} />
            <Text style={styles.modalTitle}>Welcome to MiWill</Text>
            <Text style={styles.modalSubtitle}>(or should we say your Will)</Text>
            <Text style={styles.modalBody}>
              A guided process on how to draft your will.
            </Text>
            <Text style={styles.modalStepText}>
              Step 1: Close the this popup and click on the pulsing button.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={async () => {
                if (dontShowWelcomeAgain) {
                  await setDontShowAgain('UPLOAD_WILL_WELCOME');
                }
                setShowFirstTimeGuidedModal(false);
              }}
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCheckboxContainer}
              onPress={() => setDontShowWelcomeAgain(!dontShowWelcomeAgain)}
            >
              <View style={[styles.modalCheckbox, dontShowWelcomeAgain && styles.modalCheckboxChecked]}>
                {dontShowWelcomeAgain && <Text style={styles.modalCheckmark}>✓</Text>}
              </View>
              <Text style={styles.modalCheckboxText}>Don't show again</Text>
            </TouchableOpacity>
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
                if (documentLoading) {
                  return (
                    <View style={styles.previewLoading}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={styles.previewLoadingText}>Loading document...</Text>
                    </View>
                  );
                }

                if (!documentSource) {
                  return (
                    <View style={styles.previewErrorContainer}>
                      <Text style={styles.previewErrorText}>
                        Document preview is not available.
                      </Text>
                    </View>
                  );
                }

                const webViewSource = documentSource.html
                  ? { html: documentSource.html }
                  : { uri: documentSource.uri as string };

                return (
                  <WebView
                    originWhitelist={['*']}
                    source={webViewSource}
                    style={styles.previewWebView}
                    startInLoadingState
                    javaScriptEnabled
                    domStorageEnabled
                    renderLoading={() => (
                      <View style={styles.previewLoading}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                      </View>
                    )}
                    onError={syntheticEvent => {
                      const { nativeEvent } = syntheticEvent;
                      console.error('WebView error: ', nativeEvent);
                      Alert.alert(
                        'Preview Error',
                        'Failed to load the document. Please download it to view.',
                        [{ text: 'OK', onPress: () => handleClosePreview() }]
                      );
                    }}
                    onHttpError={syntheticEvent => {
                      const { nativeEvent } = syntheticEvent;
                      console.error('WebView HTTP error: ', nativeEvent);
                      Alert.alert(
                        'Preview Error',
                        'Failed to load the document from the server.',
                        [{ text: 'OK', onPress: () => handleClosePreview() }]
                      );
                    }}
                  />
                );
            }
          })()}
        </SafeAreaView>
      </Modal>

      {/* Supersede Will Modal */}
      <Modal
        visible={showSupersedeModal}
        animationType="slide"
        transparent
        onRequestClose={cancelSupersede}
      >
        <View style={styles.supersedeModalOverlay}>
          <View style={styles.supersedeModalContainer}>
            <View style={styles.supersedeModalHeader}>
              <Ionicons name="alert-circle-outline" size={56} color={theme.colors.warning} />
              <TouchableOpacity
                style={styles.supersedeModalClose}
                onPress={cancelSupersede}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.supersedeModalTitle}>Replace Existing Will?</Text>
            <ScrollView style={styles.supersedeModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.supersedeModalText}>
                You currently have <Text style={styles.supersedeModalHighlight}>{existingWills.length} will{existingWills.length > 1 ? 's' : ''}</Text> on record.
              </Text>
              <Text style={styles.supersedeModalText}>
                Uploading this new will will <Text style={styles.supersedeModalHighlight}>supersede your existing will{existingWills.length > 1 ? 's' : ''}</Text> and become your active legal document.
              </Text>
              <View style={styles.supersedeModalInfoBox}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.supersedeModalInfoText}>
                  Your previous will{existingWills.length > 1 ? 's' : ''} will remain accessible in your archives.
                </Text>
              </View>
              <Text style={styles.supersedeModalWarning}>
                Are you sure you want to proceed?
              </Text>
            </ScrollView>
            <View style={styles.supersedeModalButtons}>
              <TouchableOpacity
                style={styles.supersedeModalButtonCancel}
                onPress={cancelSupersede}
              >
                <Text style={styles.supersedeModalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.supersedeModalButtonConfirm}
                onPress={confirmSupersede}
              >
                <Text style={styles.supersedeModalButtonConfirmText}>Yes, Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transcribe Modal */}
      <Modal
        visible={showTranscribeModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowTranscribeModal(false);
          setTranscribeWillType(null);
        }}
      >
        <View style={styles.transcribeModalOverlay}>
          <View style={styles.transcribeModalContainer}>
            <View style={styles.transcribeModalHeader}>
              <Ionicons name="chatbubbles" size={48} color={theme.colors.primary} />
              <TouchableOpacity
                style={styles.transcribeModalClose}
                onPress={() => {
                  setShowTranscribeModal(false);
                  setTranscribeWillType(null);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.transcribeModalTitle}>
              {transcribeWillType === 'document' 
                ? 'Document to Audio/Video'
                : transcribeWillType === 'video'
                ? 'Video to Text'
                : 'Audio to Text'}
            </Text>
            <ScrollView style={styles.transcribeModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.transcribeModalText}>
                {transcribeWillType === 'document'
                  ? 'Our AI can convert your written will document into an audio narration or video presentation.'
                  : 'Our AI-powered transcription service can convert your spoken will into a written document.'}
              </Text>
              <Text style={styles.transcribeModalText}>
                {transcribeWillType === 'document'
                  ? 'This makes your Will more accessible and easier to understand for your beneficiaries.'
                  : 'This feature uses advanced speech recognition technology to accurately capture your spoken Will.'}
              </Text>
              <View style={styles.transcribeFeatureList}>
                {transcribeWillType === 'document' ? (
                  <>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Natural voice narration</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Professional formatting</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Multiple voice options</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Download as MP4/MP3</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Accurate transcription</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Speaker identification</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Timestamp markers</Text>
                    </View>
                    <View style={styles.transcribeFeatureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.transcribeFeatureText}>Download as PDF</Text>
                    </View>
                  </>
                )}
              </View>
              <View style={styles.transcribeModalWarningBox}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.transcribeModalNote}>
                  This feature is coming soon and will be available in a future update.
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.transcribeModalButton}
              onPress={() => {
                setShowTranscribeModal(false);
                setTranscribeWillType(null);
              }}
            >
              <Text style={styles.transcribeModalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        onRequestClose={closePreviewModal}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={closePreviewModal}
              style={styles.previewCloseButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>
              {previewSource?.name || 'Preview'}
            </Text>
            <TouchableOpacity
              onPress={handleCancelUpload}
              style={styles.previewCancelButton}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
          {previewSource && (() => {
            switch (previewSource.type) {
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
                        {previewSource.name || 'Audio Will'}
                      </Text>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={async () => {
                          if (!audioSound) {
                            const { sound } = await Audio.Sound.createAsync(
                              { uri: previewSource.uri },
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
                            if (isPlaying) {
                              await audioSound.pauseAsync();
                              setIsPlaying(false);
                            } else {
                              await audioSound.playAsync();
                              setIsPlaying(true);
                            }
                          }
                        }}
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
                      source={{ uri: previewSource.uri }}
                      style={styles.videoPlayer}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>
                );

              case 'file':
              default:
                if (previewDocumentLoading) {
                  return (
                    <View style={styles.previewLoading}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={styles.previewLoadingText}>Loading document preview...</Text>
                    </View>
                  );
                }

                if (previewDocumentSource?.html) {
                  // Show PDF preview
                  return (
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: previewDocumentSource.html }}
                      style={styles.previewWebView}
                      startInLoadingState
                      javaScriptEnabled
                      domStorageEnabled
                      renderLoading={() => (
                        <View style={styles.previewLoading}>
                          <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                      )}
                      onError={syntheticEvent => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('WebView error: ', nativeEvent);
                        Alert.alert(
                          'Preview Error',
                          'Failed to load the document preview.',
                          [{ text: 'OK' }]
                        );
                      }}
                    />
                  );
                }

                // Fallback for non-PDF or failed preview
                return (
                  <View style={styles.previewContent}>
                    <View style={styles.previewFileContainer}>
                      <Ionicons name="document-text" size={80} color={theme.colors.primary} />
                      <Text style={styles.previewFileName}>{previewSource.name || 'Document Will'}</Text>
                      <Text style={styles.previewFileNote}>
                        {previewSource.name?.endsWith('.pdf') 
                          ? 'PDF preview is loading... The file will be uploaded securely.'
                          : 'Preview is not available for this file type. The file will be uploaded securely.'}
                      </Text>
                    </View>
                  </View>
                );
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
  aiOptionButtonDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.border + '40',
    opacity: 0.6,
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
  guidedStepsContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
    alignItems: 'flex-start',
  },
  guidedStepItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'left',
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
  existingWillIconActions: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  existingWillTopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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
  previewCancelContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  previewButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  previewAgainButton: {
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  previewAgainButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
  uploadButton: {
    flex: 2,
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  modalBody: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  modalStepText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalCloseButton: {
    alignSelf: 'stretch',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
  },
  modalCloseText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  modalCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  modalCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  modalCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold' as any,
  },
  modalCheckboxText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
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
  previewCancelButton: {
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
  previewLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
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
  supersedeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  supersedeModalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '75%',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  supersedeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  supersedeModalClose: {
    padding: theme.spacing.xs,
  },
  supersedeModalTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  supersedeModalScroll: {
    maxHeight: 300,
  },
  supersedeModalText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
  },
  supersedeModalHighlight: {
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
  supersedeModalInfoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  supersedeModalInfoText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  supersedeModalWarning: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.warning,
    marginTop: theme.spacing.md,
  },
  supersedeModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  supersedeModalButtonCancel: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  supersedeModalButtonCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  supersedeModalButtonConfirm: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
  },
  supersedeModalButtonConfirmText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  transcribeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  transcribeModalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '80%',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  transcribeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  transcribeModalClose: {
    padding: theme.spacing.xs,
  },
  transcribeModalTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  transcribeModalScroll: {
    maxHeight: 400,
  },
  transcribeModalText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
  },
  transcribeFeatureList: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  transcribeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  transcribeFeatureText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  transcribeModalWarningBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  transcribeModalNote: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  transcribeModalButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
  },
  transcribeModalButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  previewFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
  },
  previewFileName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  previewFileNote: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
});

export default UploadWillScreen;

