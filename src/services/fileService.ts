import { API_BASE_URL, CONFIG } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  uploadedAt: string;
  downloadUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

class FileService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
  }

  private async getJsonHeaders() {
    const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async uploadFile(file: any): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.fileName || file.name || 'file',
      } as any);

      const headers = await this.getAuthHeaders();
      delete headers['Content-Type']; // Let fetch set the boundary

      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers,
        body: formData,
        timeout: CONFIG.API.TIMEOUT,
      });

      const result: ApiResponse<FileUploadResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async getMyFiles(): Promise<FileUploadResponse[]> {
    try {
      const headers = await this.getJsonHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/my-files`, {
        method: 'GET',
        headers,
        timeout: CONFIG.API.TIMEOUT,
      });

      const result: ApiResponse<FileUploadResponse[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch files');
      }

      return result.data;
    } catch (error) {
      console.error('Get files error:', error);
      throw error;
    }
  }

  async getMyFilesByType(fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT'): Promise<FileUploadResponse[]> {
    try {
      const headers = await this.getJsonHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/my-files/${fileType}`, {
        method: 'GET',
        headers,
        timeout: CONFIG.API.TIMEOUT,
      });

      const result: ApiResponse<FileUploadResponse[]> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch files');
      }

      return result.data;
    } catch (error) {
      console.error('Get files by type error:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const headers = await this.getJsonHeaders();
      
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers,
        timeout: CONFIG.API.TIMEOUT,
      });

      const result: ApiResponse<void> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  async getPreviewUrl(fileId: string): Promise<string> {
    const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return `${API_BASE_URL}/files/preview/${fileId}?token=${encodeURIComponent(token)}`;
  }

  getPreviewUrlSync(fileId: string): string {
    return `${API_BASE_URL}/files/preview/${fileId}`;
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return `${API_BASE_URL}/files/download/${fileId}?token=${encodeURIComponent(token)}`;
  }

  getDownloadUrlSync(fileId: string): string {
    return `${API_BASE_URL}/files/download/${fileId}`;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const headers = await this.getJsonHeaders();
      delete headers['Content-Type'];
      
      const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
        method: 'GET',
        headers,
        timeout: CONFIG.API.TIMEOUT,
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download file error:', error);
      throw error;
    }
  }
}

export default new FileService();