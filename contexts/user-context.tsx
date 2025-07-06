"use client";

import { createContext, useState, ReactNode, Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GetCurrentUserApi } from '@/services/auth.services';
import { Loader2 } from 'lucide-react';

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
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserOnLoad = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await GetCurrentUserApi(); 
        if (response.status === 200) {
          setUser(response.data); 
          if (pathname === "/") {
            router.push("/admin");
          }
        }
      } catch (error) {
        console.error("Không thể tự động đăng nhập:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchUserOnLoad();
  }, [pathname, router]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
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