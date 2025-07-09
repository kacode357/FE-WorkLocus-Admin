// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL_API;

// ===================================================================
// BẢNG CẤU HÌNH PHÂN QUYỀN
// ===================================================================
const routeConfig: Record<string, string[]> = {
  // Các trang PM được vào (Admin cũng được vào)
  "/admin/timekeeping": ["admin", "project_manager"],
  "/admin/project": ["admin", "project_manager"],
  "/admin/task": ["admin", "project_manager"],

  // Quy tắc chung cho tất cả các trang khác trong /admin
  // Chỉ admin mới được vào các trang còn lại (như /admin/payroll, /admin/employees,...)
  // QUAN TRỌNG: Quy tắc này phải có độ dài ngắn nhất và được check sau cùng
  "/admin": ["admin"], 
};
// ===================================================================

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  try {
    const userResponse = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) throw new Error("Token không hợp lệ");

    const userData = await userResponse.json();
    const userRole = userData.data.role as string;
    const pathname = request.nextUrl.pathname;

    console.log(`Middleware: User role '${userRole}' đang cố truy cập '${pathname}'`);

    const matchingRoute = Object.keys(routeConfig)
      .sort((a, b) => b.length - a.length)
      .find(route => pathname.startsWith(route));

    if (matchingRoute) {
      const allowedRoles = routeConfig[matchingRoute];
      if (allowedRoles.includes(userRole)) {
        console.log(`Quy tắc '${matchingRoute}' được áp dụng. Cho phép truy cập.`);
        return NextResponse.next();
      }
    }
    
    // Nếu không có quyền, chuyển hướng về trang login và xóa cookie
    console.log("Không có quyền truy cập. Đăng xuất và chuyển hướng về trang login.");
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("accessToken"); 
    response.cookies.delete("refreshToken");
    return response;

  } catch (error) {
    console.error("Middleware: Lỗi ->", error);
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("accessToken"); 
    return response;
  }
}

export const config = {
  matcher: "/admin/:path*",
};