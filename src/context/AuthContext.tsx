import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService from '../services/authService';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi app khởi động
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const loggedIn = await AuthService.isLoggedIn();
      
      if (loggedIn) {
        const userInfo = await AuthService.getUserInfo();
        if (userInfo && userInfo.email) {
          setUser(userInfo);
          setIsAuthenticated(true);
        } else {
          // Nếu không có thông tin user, đăng xuất
          await AuthService.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Check auth status error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login({ email, password });
      
      if (response.success && response.data) {
        const userInfo = {
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          expiresAt: response.data.expiresAt
        };
        setUser(userInfo);
        setIsAuthenticated(true);
        return { success: true, message: 'Đăng nhập thành công!' };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Đăng nhập thất bại' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.register({ email, password, confirmPassword, firstName, lastName });
      
      return {
        success: response.success,
        message: response.message || (response.success ? 'Đăng ký thành công!' : 'Đăng ký thất bại')
      };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Đăng ký thất bại' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await AuthService.forgotPassword({ email });
      return {
        success: response.success,
        message: response.message || (response.success ? 'Email đã được gửi!' : 'Gửi email thất bại')
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Gửi email thất bại' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await AuthService.resetPassword({ token, newPassword });
      return {
        success: response.success,
        message: response.message || (response.success ? 'Đặt lại mật khẩu thành công!' : 'Đặt lại mật khẩu thất bại')
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Đặt lại mật khẩu thất bại' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;