import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Lấy BASE_URL từ biến môi trường
// Đảm bảo mày đã thêm NEXT_PUBLIC_BASE_URL_API="http://localhost:8080" vào file .env.local
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL_API;

// Kiểm tra nếu BASE_URL chưa được định nghĩa (chỉ để đảm bảo an toàn thôi)
if (!BASE_URL) {
    console.error("Lỗi: NEXT_PUBLIC_BASE_URL_API không được định nghĩa trong biến môi trường.");
    // Mày có thể ném lỗi hoặc đặt một giá trị mặc định ở đây nếu muốn
    // Ví dụ: throw new Error("Missing NEXT_PUBLIC_BASE_URL_API environment variable.");
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
    baseURL: BASE_URL, // Sử dụng biến môi trường
    headers: {
        "content-type": "application/json; charset=UTF-8",
    },
    timeout: 300000,
    timeoutErrorMessage: "Kết nối quá hạn, vui lòng thử lại.",
});

defaultAxiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

defaultAxiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (err: AxiosError<ErrorResponse>) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Kiểm tra nếu lỗi là 401 và đây KHÔNG phải là request retry HOẶC request đến endpoint login
        // Nếu nó là lỗi 401 từ endpoint login, thì không cần refresh token
        // Mà là xử lý lỗi đăng nhập sai tài khoản/mật khẩu
        const isLoginEndpoint = originalRequest.url?.includes('/api/auth/login'); // Thay đổi đường dẫn này nếu endpoint login của mày khác
        
        if (err.response?.status === 401 && !originalRequest._retry) {
            // Nếu đây là lỗi 401 từ trang đăng nhập (do sai mật khẩu/username)
            if (isLoginEndpoint) {
                handleErrorByToast(err); // Hiển thị toast lỗi từ BE (sai tk/mk)
                return Promise.reject(err);
            }

            // Đây là lỗi 401 không phải từ trang login, nghĩa là token có thể hết hạn
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

            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                isRefreshing = false;
                handleLogout();
                return Promise.reject(err);
            }

            try {
                // Endpoint refresh token cũng sử dụng BASE_URL
                const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });

                if (refreshResponse.status === 200) {
                    const newAccessToken = refreshResponse.data.data.accessToken;
                    localStorage.setItem("accessToken", newAccessToken);

                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    }
                    
                    processQueue(null, newAccessToken);
                    
                    return defaultAxiosInstance(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                console.error("Refresh token thất bại:", refreshError);
                handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Với các lỗi khác 401 hoặc lỗi 401 đã được retry
        handleErrorByToast(err);
        return Promise.reject(err);
    }
);

const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
};

// axiosWithoutLoading cũng sử dụng chung BASE_URL
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
        const token = localStorage.getItem("accessToken");
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

const handleErrorByToast = (errors: AxiosError<ErrorResponse>) => {
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
        console.error("Lỗi 404 hoặc giỏ hàng trống, không hiển thị toast.");
        return Promise.reject(data?.errors ?? { message });
    }

    if (message) {
        toast.error(message);
    }

    return Promise.reject(data?.errors ?? { message });
};

export { defaultAxiosInstance, axiosWithoutLoading };