"use client";

import { useState, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LoginUserApi, GetCurrentUserApi } from "@/services/auth.services";
import { useUser } from "@/contexts/user-context";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useUser();

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    if (!email) newErrors.email = "Vui lòng nhập email của bạn.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Địa chỉ email không hợp lệ.";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu.";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (formErrors.email || formErrors.password) {
      setErrors(formErrors);
      return;
    }
    setErrors({ email: "", password: "" });
    setIsLoading(true);

    try {
      const credentials = { email, password };
      const loginData = await LoginUserApi(credentials);

      if (loginData.status === 200) {
        toast.success(loginData.message || "Đăng nhập thành công!");

        localStorage.setItem("accessToken", loginData.data.accessToken);

        if (rememberMe) {
          localStorage.setItem("refreshToken", loginData.data.refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }

        const currentUserData = await GetCurrentUserApi();
        if (currentUserData.status === 200) {
          // Kiểm tra role của người dùng ở đây
          if (currentUserData.data.role === "admin") { // Giả định role admin là 'admin'
            setUser(currentUserData.data);
            router.push("/admin");
          } else {
            // Nếu không phải admin, hiển thị lỗi và xóa token
            toast.error("Bạn không có quyền truy cập trang quản trị.");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken"); // Xóa cả refresh token nếu có
            setUser(null); // Clear user data in context
          }
        } else {
          // Xử lý trường hợp không lấy được thông tin người dùng
          toast.error(currentUserData.message || "Không thể lấy thông tin người dùng.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }

      } else {
        toast.error(loginData.message || "Thông tin đăng nhập không hợp lệ.");
      }

    } catch (error: any) {
      console.error("Lỗi đăng nhập cuối cùng:", error);
      // Xử lý lỗi từ API LoginUserApi hoặc GetCurrentUserApi
      toast.error(error.message || "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.");
      localStorage.removeItem("accessToken"); // Đảm bảo xóa token nếu có lỗi sau khi set
      localStorage.removeItem("refreshToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  } as const;

  const imageVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
  } as const;

  return (
    <main className="min-h-screen w-full lg:grid lg:grid-cols-2 font-sans antialiased">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="lg:hidden text-center mb-8">
            <Image src="/images/logo.png" alt="WorkLocus Logo" width={64} height={64} className="mx-auto" />
          </motion.div>

          <motion.div variants={itemVariants} className="text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Chào mừng trở lại!</h1>
            <p className="mt-2 text-muted-foreground">Đăng nhập để vào trang quản trị WorkLocus</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email">Tài khoản Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email" type="email" placeholder="admin@worklocus.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-12 text-base ${errors.email ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive pt-1">{errors.email}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-12 h-12 text-base ${errors.password ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive pt-1">{errors.password}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="remember-me"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                />
                <Label htmlFor="remember-me" className="font-normal text-muted-foreground cursor-pointer">Ghi nhớ tôi</Label>
              </div>
              <a href="#" className="font-medium text-primary hover:underline underline-offset-4">Quên mật khẩu?</a>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.div whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}>
                <Button type="submit" className="w-full text-lg h-12 font-bold tracking-wide" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Đăng nhập'}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:items-center lg:justify-center bg-primary/10 p-12">
        <motion.div className="text-center" initial="hidden" animate="visible" variants={imageVariants}>
          <Image src="/images/logo.png" alt="WorkLocus Admin Logo" width={120} height={120} priority className="mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-primary">WorkLocus Admin</h2>
          <p className="mt-2 text-lg text-foreground/80">Nền tảng quản lý công việc hiệu suất cao.</p>
        </motion.div>
      </div>
    </main>
  );
}