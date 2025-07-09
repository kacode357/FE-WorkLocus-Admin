import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import Cookies from "js-cookie"; // <-- THÊM THƯ VIỆN COOKIE

// Lấy BASE_URL từ biến môi trường
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_API;

if (!BASE_URL) {
    console.error("Lỗi: NEXT_PUBLIC_BASE_URL_API không được định nghĩa trong biến môi trường.");
}

interface ErrorResponse {
    message?: string;
    errors?: { message?: string }[];
}

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const defaultAxiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "content-type": "application/json; charset=UTF-8",
    },
    timeout: 300000,
    timeoutErrorMessage: "Kết nối quá hạn, vui lòng thử lại.",
});

// Interceptor gắn token vào mỗi request
defaultAxiosInstance.interceptors.request.use(
    (config) => {
        // <-- THAY ĐỔI: Đọc token từ Cookie
        const token = Cookies.get("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor xử lý lỗi, đặc biệt là lỗi 401 (token hết hạn)
defaultAxiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (err: AxiosError<ErrorResponse>) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isLoginEndpoint = originalRequest.url?.includes('/api/auth/login');
        
        if (err.response?.status === 401 && !originalRequest._retry) {
            if (isLoginEndpoint) {
                handleErrorByToast(err);
                return Promise.reject(err);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    }
                    return defaultAxiosInstance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            // <-- THAY ĐỔI: Đọc refreshToken từ Cookie
            const refreshToken = Cookies.get("refreshToken");
            if (!refreshToken) {
                isRefreshing = false;
                handleLogout(); // Gọi hàm đăng xuất nếu không có refresh token
                return Promise.reject(err);
            }

            try {
                const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });

                if (refreshResponse.status === 200) {
                    const newAccessToken = refreshResponse.data.data.accessToken;
                    
                    // <-- THAY ĐỔI: Lưu accessToken mới vào Cookie
                    Cookies.set("accessToken", newAccessToken, {
                        expires: 1,
                        secure: process.env.NODE_ENV === "production",
                    });

                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    }
                    
                    processQueue(null, newAccessToken);
                    
                    return defaultAxiosInstance(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                console.error("Refresh token thất bại:", refreshError);
                handleLogout(); // Đăng xuất nếu refresh token cũng thất bại
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        handleErrorByToast(err);
        return Promise.reject(err);
    }
);

const handleLogout = () => {
    // <-- THAY ĐỔI: Xóa token trong Cookie
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    
    // Chuyển hướng về trang chủ
    if (window.location.pathname !== "/") {
        window.location.href = "/";
    }
    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
};


// ----- CÁC INSTANCE KHÁC CŨNG CẦN CẬP NHẬT TƯƠNG TỰ -----

const axiosWithoutLoading: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "content-type": "application/json; charset=UTF-8",
    },
    timeout: 300000,
    timeoutErrorMessage: "Kết nối quá hạn, vui lòng thử lại.",
});

axiosWithoutLoading.interceptors.request.use(
    (config) => {
        // <-- THAY ĐỔI: Đọc token từ Cookie
        const token = Cookies.get("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosWithoutLoading.interceptors.response.use(
    (response: AxiosResponse) => {
        return response.data;
    },
    (err: AxiosError<ErrorResponse>) => {
        handleErrorByToast(err);
        return Promise.reject(err);
    }
);

// Hàm handleErrorByToast không cần thay đổi
const handleErrorByToast = (errors: AxiosError<ErrorResponse>) => {
    // ... (giữ nguyên logic)
    const data = errors.response?.data;
    let message: string | undefined = data?.message ?? errors.message ?? "Đã có lỗi xảy ra";

    if (!data?.message && data?.errors?.length) {
        const errorMessages = data.errors
            .map((error) => error.message)
            .filter(Boolean);
        if (errorMessages.length) {
            message = errorMessages.join(", ");
        }
    }
    if (message === "Cart null!." || errors.response?.status === 404) {
        console.error("Lỗi 404 hoặc giỏ hàng trống, không hiển thị toast");
        return Promise.reject(data?.errors ?? { message });
    }
    if (message) {
        toast.error(message);
    }
    return Promise.reject(data?.errors ?? { message });
};

export { defaultAxiosInstance, axiosWithoutLoading };