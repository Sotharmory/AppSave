import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: CONFIG.API.BASE_URL,
  timeout: CONFIG.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, xóa token và redirect về login
      await AsyncStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
      await AsyncStorage.removeItem(CONFIG.AUTH.USER_INFO_KEY);
    }
    return Promise.reject(error);
  }
);

// Interfaces cho request/response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Auth Service
export class AuthService {
  // Đăng nhập
  static async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const result = response.data;
      
      if (result.success && result.data && result.data.token && result.data.email) {
        // Lưu token và thông tin user
        await AsyncStorage.setItem(CONFIG.AUTH.TOKEN_KEY, result.data.token);
        const userInfo = {
          email: result.data.email,
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          expiresAt: result.data.expiresAt || ''
        };
        await AsyncStorage.setItem(CONFIG.AUTH.USER_INFO_KEY, JSON.stringify(userInfo));
      }
      
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại',
      };
    }
  }

  // Đăng ký
  static async register(userData: RegisterRequest): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại',
      };
    }
  }

  // Quên mật khẩu
  static async forgotPassword(email: ForgotPasswordRequest): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.post('/auth/forgot-password', email);
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gửi email thất bại',
      };
    }
  }

  // Reset mật khẩu
  static async resetPassword(resetData: ResetPasswordRequest): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.post('/auth/reset-password', resetData);
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Đặt lại mật khẩu thất bại',
      };
    }
  }

  // Validate reset token
  static async validateResetToken(token: string): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.get(`/auth/validate-reset-token?token=${token}`);
      return response.data;
    } catch (error: any) {
      console.error('Validate token error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Token không hợp lệ',
      };
    }
  }

  // Đăng xuất
  static async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
      const userInfo = await AsyncStorage.getItem(CONFIG.AUTH.USER_INFO_KEY);
      
      if (token) {
        await AsyncStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
      }
      if (userInfo) {
        await AsyncStorage.removeItem(CONFIG.AUTH.USER_INFO_KEY);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Kiểm tra trạng thái đăng nhập
  static async isLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Check login status error:', error);
      return false;
    }
  }

  // Lấy thông tin user
  static async getUserInfo(): Promise<any> {
    try {
      const userInfo = await AsyncStorage.getItem(CONFIG.AUTH.USER_INFO_KEY);
      if (userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
        return JSON.parse(userInfo);
      }
      return null;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  // Kiểm tra health của service
  static async checkHealth(): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.get('/auth/health');
      return response.data;
    } catch (error: any) {
      console.error('Health check error:', error);
      return {
        success: false,
        message: 'Service không khả dụng',
      };
    }
  }
}

export default AuthService;