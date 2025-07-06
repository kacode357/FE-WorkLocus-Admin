import { defaultAxiosInstance } from '@/config/axios.config';

// Gọi API để đăng nhập người dùng.
const LoginUserApi = async (data: { email: string; password: string; }) => {
    const response = await defaultAxiosInstance.post('/api/auth/login', data);
    return response.data;
};

// Gọi API để lấy thông tin người dùng đang đăng nhập.
const GetCurrentUserApi = async () => {
    const response = await defaultAxiosInstance.get('/api/auth/me');
    return response.data;
};
// Gọi API để làm mới token đăng nhập.
const RefreshTokenApi = async (data: { refreshToken: string }) => {
    // Quan trọng: Gọi thẳng qua axios để tránh interceptor của chính nó gây vòng lặp vô hạn
    const response = await defaultAxiosInstance.post('/api/auth/refresh-token', data);
    return response.data;
};

export {
    RefreshTokenApi,
    GetCurrentUserApi,
    LoginUserApi,
};