import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import DocumentPicker from '@react-native-documents/picker';
import { useAuth } from '../context/AuthContext';
import fileService, { FileUploadResponse } from '../services/fileService';
import VideoThumbnail from '../components/VideoThumbnail';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemSize = (width - 60) / numColumns;

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('ALL');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUploadResponse | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileUploadResponse[]>([]);

  useEffect(() => {
    loadFiles();
  }, [selectedFilter]);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery]);

  const filterFiles = () => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file => 
        file.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  };

  const loadPreviewUrls = async (fileList: FileUploadResponse[]) => {
    const urls: {[key: string]: string} = {};
    
    for (const file of fileList) {
      try {
        if (file.fileType === 'IMAGE' || file.fileType === 'VIDEO') {
          urls[file.id] = await fileService.getPreviewUrl(file.id);
        }
      } catch (error) {
        console.error('Error loading preview URL for file:', file.id, error);
        // Fallback to sync version without token
        urls[file.id] = fileService.getPreviewUrlSync(file.id);
      }
    }
    
    setPreviewUrls(urls);
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      let fileList: FileUploadResponse[];
      
      if (selectedFilter === 'ALL') {
        fileList = await fileService.getMyFiles();
      } else {
        fileList = await fileService.getMyFilesByType(selectedFilter);
      }
      
      setFiles(fileList);
      await loadPreviewUrls(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách file');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Tải lên file',
      'Chọn loại file bạn muốn tải lên',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Ảnh/Video từ thư viện',
          onPress: () => selectFromLibrary(),
        },
        {
          text: 'Chụp ảnh/quay video',
          onPress: () => openCamera(),
        },
        {
          text: 'Tài liệu',
          onPress: () => selectDocument(),
        },
      ]
    );
  };

  const selectFromLibrary = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        uploadFile(response.assets[0]);
      }
    });
  };

  const openCamera = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        uploadFile(response.assets[0]);
      }
    });
  };

  const selectDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        allowMultiSelection: false,
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result.length > 0) {
        uploadFile(result[0]);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
      } else {
        console.error('Document picker error:', error);
        Alert.alert('Lỗi', 'Không thể chọn tài liệu');
      }
    }
  };

  const uploadFile = async (file: any) => {
    try {
      setUploading(true);
      await fileService.uploadFile(file);
      Alert.alert('Thành công', 'File đã được tải lên thành công');
      await loadFiles(); // Reload files
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Lỗi', 'Không thể tải lên file');
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewFile = (file: FileUploadResponse) => {
    setSelectedFile(file);
    setPreviewModalVisible(true);
  };

  const handleDownloadFile = async (file: FileUploadResponse) => {
    try {
      setDownloading(file.id);
      
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Trên mobile, mở URL download trong browser
        try {
          const downloadUrl = await fileService.getDownloadUrl(file.id);
          const supported = await Linking.canOpenURL(downloadUrl);
          
          if (supported) {
            await Linking.openURL(downloadUrl);
            Alert.alert('Thành công', 'File đang được tải xuống');
          } else {
            Alert.alert('Lỗi', 'Không thể mở liên kết tải xuống');
          }
        } catch (urlError) {
          console.error('Error getting download URL:', urlError);
          // Fallback: try to download using the file service
          try {
            const blob = await fileService.downloadFile(file.id);
            Alert.alert('Thành công', 'File đã được tải xuống');
          } catch (downloadError) {
            Alert.alert('Lỗi', 'Không thể tải xuống file. Vui lòng thử lại.');
          }
        }
      } else {
        // Trên web hoặc desktop
        try {
          const blob = await fileService.downloadFile(file.id);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.originalFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          Alert.alert('Thành công', 'File đã được tải xuống');
        } catch (downloadError) {
          Alert.alert('Lỗi', 'Không thể tải xuống file');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải xuống file');
    } finally {
      setDownloading(null);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getDocumentIcon = (contentType: string, filename: string) => {
    const extension = getFileExtension(filename);
    
    if (contentType.includes('pdf') || extension === 'PDF') return '📄';
    if (contentType.includes('word') || ['DOC', 'DOCX'].includes(extension)) return '📝';
    if (contentType.includes('excel') || ['XLS', 'XLSX'].includes(extension)) return '📊';
    if (contentType.includes('powerpoint') || ['PPT', 'PPTX'].includes(extension)) return '📋';
    if (contentType.includes('text') || extension === 'TXT') return '📃';
    if (['ZIP', 'RAR', '7Z'].includes(extension)) return '🗜️';
    
    return '📄';
  };

  const deleteFile = (fileId: string, fileName: string) => {
    Alert.alert(
      'Xóa file',
      `Bạn có chắc chắn muốn xóa file "${fileName}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileService.deleteFile(fileId);
              Alert.alert('Thành công', 'File đã được xóa');
              await loadFiles();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa file');
            }
          },
        },
      ]
    );
  };

  const renderFileItem = ({ item }: { item: FileUploadResponse }) => {
    const isImage = item.fileType === 'IMAGE';
    const isVideo = item.fileType === 'VIDEO';
    const isDocument = item.fileType === 'DOCUMENT';
    const isDownloading = downloading === item.id;

    return (
      <View style={styles.fileItem}>
        <TouchableOpacity 
          style={styles.filePreview}
          onPress={() => handlePreviewFile(item)}
        >
          {isImage && (
            <Image 
              source={{ uri: previewUrls[item.id] || fileService.getPreviewUrlSync(item.id) }}
              style={styles.fileImage}
              resizeMode="cover"
            />
          )}
          {isVideo && (
            <VideoThumbnail
              uri={previewUrls[item.id] || fileService.getPreviewUrlSync(item.id)}
              style={styles.fileImage}
              showPlayIcon={true}
            />
          )}
          {isDocument && (
            <View style={styles.documentPlaceholder}>
              <Text style={styles.documentIcon}>
                {getDocumentIcon(item.contentType, item.originalFileName)}
              </Text>
              <Text style={styles.documentExtension}>
                {getFileExtension(item.originalFileName)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.fileName} numberOfLines={2}>
          {item.originalFileName}
        </Text>
        <Text style={styles.fileSize}>
          {(item.fileSize / 1024 / 1024).toFixed(2)} MB
        </Text>
        
        <View style={styles.fileActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePreviewFile(item)}
          >
            <Text style={styles.actionButtonText}>👁️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isDownloading && styles.actionButtonDisabled]}
            onPress={() => handleDownloadFile(item)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#3498db" />
            ) : (
              <Text style={styles.actionButtonText}>⬇️</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteFile(item.id, item.originalFileName)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterButton = (filter: 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Chào mừng!</Text>
          <Text style={styles.welcomeSubtitle}>
            Xin chào {user?.email}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadSection}>
        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
          onPress={showUploadOptions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>📤 Tải lên file</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'Tất cả')}
        {renderFilterButton('IMAGE', 'Ảnh')}
        {renderFilterButton('VIDEO', 'Video')}
        {renderFilterButton('DOCUMENT', 'Tài liệu')}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm file..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filesContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy file nào' : 'Chưa có file nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Nhấn nút "Tải lên file" để bắt đầu'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFiles}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.filesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3498db']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedFile?.originalFileName}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setPreviewModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {selectedFile && (
                <View style={styles.previewContainer}>
                  {selectedFile.fileType === 'IMAGE' && (
                    <Image 
                      source={{ uri: previewUrls[selectedFile.id] || fileService.getPreviewUrlSync(selectedFile.id) }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  )}
                  
                  {selectedFile.fileType === 'VIDEO' && (
                    <View style={styles.previewVideoContainer}>
                      <VideoThumbnail
                        uri={previewUrls[selectedFile.id] || fileService.getPreviewUrlSync(selectedFile.id)}
                        style={styles.previewVideoThumbnail}
                        showPlayIcon={false}
                      />
                      <View style={styles.videoPreviewOverlay}>
                        <Text style={styles.videoPreviewText}>🎥 Video Preview</Text>
                        <Text style={styles.videoPreviewSubtext}>Nhấn tải xuống để xem video</Text>
                      </View>
                    </View>
                  )}
                  
                  {selectedFile.fileType === 'DOCUMENT' && (
                    <View style={styles.previewDocumentContainer}>
                      <Text style={styles.previewDocumentIcon}>
                        {getDocumentIcon(selectedFile.contentType, selectedFile.originalFileName)}
                      </Text>
                      <Text style={styles.previewDocumentType}>
                        {getFileExtension(selectedFile.originalFileName)}
                      </Text>
                      <Text style={styles.previewDocumentText}>Document Preview</Text>
                      <Text style={styles.previewDocumentSubtext}>Nhấn tải xuống để xem tài liệu</Text>
                    </View>
                  )}
                  
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileInfoLabel}>Tên file:</Text>
                    <Text style={styles.fileInfoValue}>{selectedFile.originalFileName}</Text>
                    
                    <Text style={styles.fileInfoLabel}>Kích thước:</Text>
                    <Text style={styles.fileInfoValue}>
                      {(selectedFile.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Text>
                    
                    <Text style={styles.fileInfoLabel}>Loại:</Text>
                    <Text style={styles.fileInfoValue}>{selectedFile.fileType}</Text>
                    
                    <Text style={styles.fileInfoLabel}>Ngày tải lên:</Text>
                    <Text style={styles.fileInfoValue}>
                      {new Date(selectedFile.uploadedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => selectedFile && handleDownloadFile(selectedFile)}
                disabled={downloading === selectedFile?.id}
              >
                {downloading === selectedFile?.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>⬇️ Tải xuống</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setPreviewModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 30,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filesContainer: {
    flex: 1,
    marginTop: 10,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  filesList: {
    padding: 20,
  },
  fileItem: {
    width: itemSize,
    marginRight: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filePreview: {
    width: '100%',
    height: itemSize * 0.7,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },

  documentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e67e22',
  },
  documentIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  documentExtension: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  fileName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 32,
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  actionButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3498db',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 250,
    marginBottom: 16,
    borderRadius: 8,
  },
  previewVideoContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewVideoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  videoPreviewSubtext: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  previewDocumentContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewDocumentIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  previewDocumentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  previewDocumentText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  previewDocumentSubtext: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  fileInfo: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  fileInfoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 8,
    marginBottom: 2,
  },
  fileInfoValue: {
    fontSize: 14,
    color: '#2c3e50',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#3498db',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonSecondary: {
    backgroundColor: '#ecf0f1',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalButtonTextSecondary: {
    color: '#7f8c8d',
  },
});

export default HomeScreen;