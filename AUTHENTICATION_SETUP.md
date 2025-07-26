# Hướng dẫn tích hợp Authentication Backend vào React Native App

## Tổng quan

Project này đã được tích hợp với backend authentication service sử dụng Spring Boot và MongoDB. Các tính năng bao gồm:

- Đăng ký tài khoản
- Đăng nhập
- Quên mật khẩu
- Đặt lại mật khẩu
- Quản lý JWT token
- Auto-logout khi token hết hạn

## Cấu trúc Project

```
src/
├── config/
│   └── config.ts              # Cấu hình app
├── context/
│   └── AuthContext.tsx        # Context quản lý authentication state
├── screens/
│   ├── LoginScreen.tsx        # Màn hình đăng nhập
│   ├── RegisterScreen.tsx     # Màn hình đăng ký
│   ├── ForgotPasswordScreen.tsx # Màn hình quên mật khẩu
│   └── HomeScreen.tsx         # Màn hình chính sau khi đăng nhập
└── services/
    └── authService.ts         # Service gọi API authentication
```

## Cài đặt Dependencies

```bash
npm install @react-native-async-storage/async-storage axios
```

## Cấu hình Backend

### 1. Khởi động MongoDB

```bash
cd backend
docker-compose up -d
```

### 2. Khởi động Spring Boot Application

```bash
cd backend
./mvnw spring-boot:run
```

Hoặc sử dụng file batch:

```bash
cd backend
run.bat
```

### 3. Kiểm tra Backend

Truy cập: http://localhost:8080/api/auth/health

## Cấu hình Frontend

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình API URL

Trong file `src/config/config.ts`, cập nhật URL backend nếu cần:

```typescript
export const CONFIG = {
  API: {
    BASE_URL: 'http://localhost:8080/api', // Thay đổi nếu cần
    TIMEOUT: 10000,
  },
  // ...
};
```

### 3. Khởi động React Native App

```bash
npm start
```

Trong terminal khác:

```bash
# Cho Android
npm run android

# Cho iOS
npm run ios
```

## Sử dụng Authentication

### 1. Sử dụng AuthContext

```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Sử dụng các function và state
};
```

### 2. Các function có sẵn

- `login(email, password)`: Đăng nhập
- `register(email, password)`: Đăng ký
- `logout()`: Đăng xuất
- `forgotPassword(email)`: Gửi email reset password
- `resetPassword(token, newPassword)`: Đặt lại mật khẩu

### 3. State management

- `user`: Thông tin user hiện tại
- `isAuthenticated`: Trạng thái đăng nhập
- `isLoading`: Trạng thái loading

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/forgot-password` | Quên mật khẩu |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |
| GET | `/auth/validate-reset-token` | Validate reset token |
| GET | `/auth/health` | Kiểm tra health |

## Tính năng đã tích hợp

### 1. Auto Navigation
- Tự động chuyển đến HomeScreen khi đăng nhập thành công
- Tự động chuyển về LoginScreen khi đăng xuất

### 2. Token Management
- Tự động lưu JWT token vào AsyncStorage
- Tự động thêm token vào header của các API call
- Tự động xóa token khi logout hoặc token hết hạn

### 3. Error Handling
- Xử lý lỗi network
- Xử lý lỗi validation
- Hiển thị thông báo lỗi thân thiện

### 4. Loading States
- Hiển thị loading indicator khi đang xử lý
- Disable button khi đang loading

### 5. Form Validation
- Validate email format
- Validate password length
- Validate required fields

## Troubleshooting

### 1. Không kết nối được Backend

- Kiểm tra Backend có đang chạy không
- Kiểm tra URL trong config
- Kiểm tra firewall/network

### 2. MongoDB connection error

- Kiểm tra Docker container có đang chạy không
- Kiểm tra port 27017 có bị conflict không

### 3. Email không gửi được

- Kiểm tra cấu hình email trong `application.properties`
- Kiểm tra app password của Gmail

## Mở rộng

### 1. Thêm tính năng mới

- Tạo API endpoint mới trong backend
- Thêm function vào AuthService
- Cập nhật AuthContext nếu cần

### 2. Thêm validation

- Cập nhật CONFIG.VALIDATION trong config.ts
- Thêm validation logic vào các screen

### 3. Thêm screen mới

- Tạo screen component
- Thêm vào navigation trong App.tsx
- Sử dụng useAuth hook để access authentication state

## Bảo mật

- JWT token được lưu trong AsyncStorage (secure storage)
- API sử dụng HTTPS trong production
- Password được hash bằng BCrypt
- Email validation để tránh spam
- Rate limiting trên backend

## Production Deployment

### Backend
- Deploy Spring Boot app lên cloud (AWS, GCP, Azure)
- Sử dụng MongoDB Atlas hoặc cloud database
- Cấu hình environment variables
- Setup SSL certificate

### Frontend
- Build production APK/IPA
- Cập nhật API URL trong config
- Test trên real device
- Submit lên App Store/Play Store