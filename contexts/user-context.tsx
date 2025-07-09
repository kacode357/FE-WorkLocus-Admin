"use client";

import { createContext, useState, ReactNode, Dispatch, SetStateAction, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GetCurrentUserApi } from '@/services/auth.services';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

// --- Interfaces giữ nguyên ---
interface User {
  _id: string;
  email: string;
  full_name: string;
  role: string;
  image_url?: string;
}

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

  // --- THAY ĐỔI 1: Bọc hàm logout trong useCallback để nó ổn định ---
  // Điều này tránh các lỗi tiềm ẩn về "stale closure" và re-render không cần thiết
  const logout = useCallback(() => {
    setUser(null);
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    router.push("/");
  }, [router]); // router là dependency

  useEffect(() => {
    const fetchUserOnLoad = async () => {
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
          // Ném lỗi tường minh hơn
          throw new Error(`API returned status ${response.status}`);
        }
      } catch (error: any) {
        // --- THAY ĐỔI 2: In ra lỗi chi tiết để debug ---
        console.error("LỖI TRONG USER-CONTEXT:", error);
        // Nếu lỗi có response từ server (ví dụ: 401, 403), in nó ra
        if (error.response) {
            console.error("DATA LỖI TỪ SERVER:", error.response.data);
        }
        logout();
      } finally {
        setIsLoading(false); 
      }
    };

    fetchUserOnLoad();
  }, [logout]); // Thêm logout vào dependency array

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