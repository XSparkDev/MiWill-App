import * as FileSystem from 'expo-file-system';
import { config } from '../config/env.config';
import { Platform } from 'react-native';

export class DocumentService {
  private static storageRoot = config.storage.localRoot;

  /**
   * Save document to local storage
   */
  static async saveDocument(
    userId: string,
    folder: 'wills' | 'assets' | 'policies' | 'executor_documents' | 'death_certificates' | 'profile_pictures',
    fileName: string,
    fileUri: string
  ): Promise<string> {
    try {
      // Create user-specific directory path
      const userDir = `${this.storageRoot}/${folder}/${userId}`;
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(userDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(userDir, { intermediates: true });
      }

      // Copy file to destination
      const destinationUri = `${userDir}/${fileName}`;
      await FileSystem.copyAsync({
        from: fileUri,
        to: destinationUri,
      });

      return destinationUri;
    } catch (error: any) {
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  /**
   * Get document URL (local file path)
   */
  static getDocumentUrl(
    userId: string,
    folder: 'wills' | 'assets' | 'policies' | 'executor_documents' | 'death_certificates' | 'profile_pictures',
    fileName: string
  ): string {
    return `${this.storageRoot}/${folder}/${userId}/${fileName}`;
  }

  /**
   * Delete document from local storage
   */
  static async deleteDocument(
    userId: string,
    folder: 'wills' | 'assets' | 'policies' | 'executor_documents' | 'death_certificates' | 'profile_pictures',
    fileName: string
  ): Promise<void> {
    try {
      const filePath = `${this.storageRoot}/${folder}/${userId}/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    } catch (error: any) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Check if document exists
   */
  static async documentExists(
    userId: string,
    folder: 'wills' | 'assets' | 'policies' | 'executor_documents' | 'death_certificates' | 'profile_pictures',
    fileName: string
  ): Promise<boolean> {
    try {
      const filePath = `${this.storageRoot}/${folder}/${userId}/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get document info (size, etc.)
   */
  static async getDocumentInfo(
    userId: string,
    folder: 'wills' | 'assets' | 'policies' | 'executor_documents' | 'death_certificates' | 'profile_pictures',
    fileName: string
  ): Promise<FileSystem.FileInfo | null> {
    try {
      const filePath = `${this.storageRoot}/${folder}/${userId}/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists ? fileInfo : null;
    } catch (error) {
      return null;
    }
  }
}

export default DocumentService;

