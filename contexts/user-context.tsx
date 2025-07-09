"use client";

import { createContext, useState, ReactNode, Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetCurrentUserApi } from '@/services/auth.services';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie'; // <-- Dùng Cookies ở đây nữa

// --- Interface User không đổi ---
interface User {
  _id: string;
  email: string;
  full_name: string;
  role: string;
  image_url?: string;
}

// --- Interface UserContextType không đổi ---
interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  logout: () => void;
  isLoading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const router = useRouter();

  // --- THAY ĐỔI LOGIC TRONG USEEFFECT ---
  useEffect(() => {
    const fetchUserOnLoad = async () => {
      // 1. Đọc token từ Cookie thay vì localStorage
      const token = Cookies.get("accessToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await GetCurrentUserApi(); 
        if (response.status === 200) {
          setUser(response.data); 
        } else {
          // Nếu API trả về status không phải 200, cũng coi như lỗi
          throw new Error("Failed to fetch user with valid status");
        }
      } catch (error) {
        console.error("Token không hợp lệ hoặc hết hạn, tự động đăng xuất.", error);
        // 2. Nếu có lỗi (token hết hạn), tự động gọi hàm logout để dọn dẹp
        logout();
      } finally {
        setIsLoading(false); 
      }
    };

    fetchUserOnLoad();
  }, []); // 3. Chỉ cần chạy 1 lần khi app load, không cần phụ thuộc vào pathname nữa

  const logout = () => {
    setUser(null);
    // 4. Xóa token trong Cookie
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    router.push("/");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};