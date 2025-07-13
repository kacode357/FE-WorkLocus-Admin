// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL_API;
const LOGIN_PATH = "/"; // Đường dẫn trang login của mày

// ===================================================================
// BẢNG CẤU HÌNH PHÂN QUYỀN (Giữ nguyên)
// ===================================================================
const routeConfig: Record<string, string[]> = {
  "/admin/timekeeping": ["admin", "project_manager"],
  "/admin/project": ["admin", "project_manager"],
  "/admin/task": ["admin", "project_manager"],
  "/admin": ["admin"],
};
// ===================================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get("accessToken")?.value;

  // --- LOGIC MỚI: XỬ LÝ KHI USER ĐÃ LOGIN MÀ VÀO LẠI TRANG LOGIN ---
  if (accessToken && pathname === LOGIN_PATH) {
    console.log("Middleware: User đã đăng nhập, chuyển hướng vào /admin.");
    // Chuyển thẳng vào /admin, logic phân quyền trong /admin sẽ tự điều hướng tiếp
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  
  // Nếu chưa login mà vào trang login thì cho qua
  if (!accessToken && pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // --- LOGIC CŨ: BẢO VỆ CÁC TRANG /admin/* ---
  if (!accessToken) {
    console.log("Middleware: Không có accessToken, chuyển hướng về trang login.");
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  try {
    // Thử lấy thông tin user với accessToken hiện tại
    const userResponse = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Nếu accessToken hết hạn hoặc không hợp lệ, nó sẽ throw lỗi và nhảy xuống catch
    if (!userResponse.ok) throw new Error("Token không hợp lệ hoặc đã hết hạn");

    const userData = await userResponse.json();
    const userRole = userData.data.role as string;

    console.log(`Middleware: User role '${userRole}' đang cố truy cập '${pathname}'`);

    // Logic phân quyền (giữ nguyên như của mày)
    const matchingRoute = Object.keys(routeConfig)
      .sort((a, b) => b.length - a.length)
      .find(route => pathname.startsWith(route));

    if (matchingRoute) {
      const allowedRoles = routeConfig[matchingRoute];
      if (allowedRoles.includes(userRole)) {
        console.log(`Quy tắc '${matchingRoute}' được áp dụng. Cho phép truy cập.`);
        return NextResponse.next(); // Cho phép truy cập
      }
    }

    // Nếu không có quyền, đăng xuất và chuyển hướng
    console.log("Không có quyền truy cập. Đăng xuất và chuyển hướng về trang login.");
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;

  } catch (error) {
    console.warn("Middleware: AccessToken không hợp lệ, thử làm mới bằng RefreshToken...");
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      console.log("Middleware: Không tìm thấy refreshToken. Đăng xuất.");
      const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
      response.cookies.delete("accessToken");
      return response;
    }

    // --- LOGIC MỚI: GỌI API REFRESH TOKEN ---
    try {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) throw new Error("Refresh token không hợp lệ.");

      const newTokens = await refreshResponse.json();
      const newAccessToken = newTokens.data.accessToken;

      console.log("Middleware: Làm mới token thành công!");
      
      // Tạo một response để đi tiếp và GẮN accessToken MỚI vào cookie
      const response = NextResponse.next();
      response.cookies.set("accessToken", newAccessToken, {
        path: "/",
        // Các thuộc tính khác như expires, secure, httpOnly tùy mày cấu hình
      });
      return response;

    } catch (refreshError) {
      console.error("Middleware: Làm mới token thất bại. Đăng xuất.", refreshError);
      const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }
}

// Cấu hình matcher để nó chạy trên TẤT CẢ các trang admin VÀ trang login
export const config = {
  matcher: ["/admin/:path*", "/"],
};