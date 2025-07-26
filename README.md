# AppP2P
#RUN SOURCE /npx react-native run-android
## Source Structure

```
AppP2P/
├── src/
│   ├── screens/         # Các màn hình (LoginScreen, HomeScreen, ...)
│   ├── components/      # Các component dùng lại (nếu có)
│   ├── navigation/      # Cấu hình navigation (nếu phức tạp)
│   └── utils/           # Hàm tiện ích (nếu có)
├── App.tsx              # Entry point, khai báo NavigationContainer
├── index.js             # Đăng ký app
├── package.json         # Thông tin package
├── ...
```

- **src/screens/**: Chứa các màn hình chính của app (ví dụ: LoginScreen, RegisterScreen, HomeScreen, ...)
- **src/components/**: Chứa các component nhỏ, dùng lại nhiều nơi.
- **src/navigation/**: (Tùy chọn) Nếu app có nhiều stack/tab, nên tách cấu hình navigation vào đây.
- **src/utils/**: (Tùy chọn) Các hàm tiện ích, xử lý logic chung.

## Quick Start
- Màn hình đầu tiên là LoginScreen.
- Đã tích hợp sẵn navigation (react-navigation/native-stack).

## Phát triển thêm
- Thêm màn hình mới: tạo file mới trong `src/screens/` và thêm vào Stack.Navigator trong App.tsx hoặc tách riêng navigation vào `src/navigation/` nếu phức tạp.
