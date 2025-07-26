// App Configuration
export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'http://192.168.1.166:8080/api',
    TIMEOUT: 30000, // Tăng timeout cho file operations
  },
  
  // Authentication Configuration
  AUTH: {
    TOKEN_KEY: 'authToken',
    USER_INFO_KEY: 'userInfo',
  },
  
  // File Configuration
  FILE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Validation Rules
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 6,
  },
  
  // App Information
  APP: {
    NAME: 'AppP2P',
    VERSION: '1.0.0',
  },
};

// Environment-specific configurations
export const getApiUrl = () => {
  // Trong production, bạn có thể thay đổi URL này
  // hoặc sử dụng environment variables
  return CONFIG.API.BASE_URL;
};

// Export API_BASE_URL for backward compatibility
export const API_BASE_URL = CONFIG.API.BASE_URL;

export default CONFIG;