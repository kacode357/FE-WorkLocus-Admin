"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Menu, Package2, User, Loader2, LogOut, ChevronLeft,
    ClipboardList, CalendarCheck, Award, CircleDollarSign, MapPin,
    Wallet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";

function FullScreenLoader() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useUser();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (isLoading || !user) {
        return <FullScreenLoader />;
    }

    const getInitials = (name: string) => {
        if (!name) return "AD";
        const names = name.split(' ');
        return ((names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")).toUpperCase();
    };

    return (
        <div
            className={cn(
                "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
                isSidebarOpen ? "md:grid-cols-[220px_1fr]" : "md:grid-cols-[60px_1fr]"
            )}
        >
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex flex-col h-full">
                    <div className={cn("flex h-14 items-center border-b lg:h-[60px]", isSidebarOpen ? "px-4 lg:px-6" : "px-3")}>
                        <Link href="/admin" className={cn("flex w-full items-center gap-2 font-semibold overflow-hidden", !isSidebarOpen && "justify-center")}>
                            <Package2 className="h-6 w-6 flex-shrink-0" />
                            <span className={cn("whitespace-nowrap transition-all duration-200", isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0")}>
                                WorkLocus
                            </span>
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        {/* Truyền user vào MainNav để nó biết role là gì */}
                        <MainNav isSidebarOpen={isSidebarOpen} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <MobileNav />
                        </SheetContent>
                    </Sheet>

                    <Button variant="outline" size="icon" className="hidden md:flex shrink-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <ChevronLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>

                    <div className="w-full flex-1 flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <Avatar>
                                        <AvatarImage src={user.image_url} alt={user.full_name} />
                                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">Chào, {user.full_name}!</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}


// ===================================================================
// --- SỬA LẠI COMPONENT MAINNAV Ở ĐÂY ---
// ===================================================================
function MainNav({ isSidebarOpen }: { isSidebarOpen: boolean }) {
    const pathname = usePathname();
    const { user } = useUser(); // Lấy thông tin user từ context

    const baseLinkClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary overflow-hidden";
    const activeLinkClass = "bg-muted text-primary";
    const collapsedClass = !isSidebarOpen ? "justify-center gap-0" : "";

    // 1. Định nghĩa TẤT CẢ các mục menu có thể có, kèm theo danh sách 'roles' được xem
    const allNavItems = [
        { href: "/admin", label: "Tổng quát", icon: Home, roles: ["admin"] },
        { href: "/admin/timekeeping", label: "Chấm công", icon: CalendarCheck, roles: ["admin", "project_manager"] },
        { href: "/admin/project", label: "Dự án", icon: Package2, roles: ["admin", "project_manager"] },
        { href: "/admin/task", label: "Công việc", icon: ClipboardList, roles: ["admin", "project_manager"] },

        // Các mục chỉ dành cho admin
        { href: "/admin/account", label: "Tài khoản", icon: User, roles: ["admin"] },
        { href: "/admin/bonus", label: "Mức thưởng", icon: Award, roles: ["admin"] },
        { href: "/admin/payroll", label: "Tính lương", icon: CircleDollarSign, roles: ["admin"] },
        { href: "/admin/payroll-history", label: "Lịch sử lương", icon: Wallet, roles: ["admin"] },
        { href: "/admin/address", label: "Địa chỉ", icon: MapPin, roles: ["admin"] },
    ];

    // 2. Lọc ra danh sách các mục menu mà user hiện tại được phép xem
    // user chắc chắn không null ở đây vì đã có check ở component cha
    const visibleNavItems = allNavItems.filter(item => item.roles.includes(user!.role));

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {/* 3. Render danh sách đã được lọc */}
            {visibleNavItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(baseLinkClass, pathname === item.href && activeLinkClass, collapsedClass)}
                >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className={cn("whitespace-nowrap transition-all duration-200", isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0")}>
                        {item.label}
                    </span>
                </Link>
            ))}
        </nav>
    );
}

// MobileNav không cần sửa vì nó cũng gọi MainNav
function MobileNav() {
    return (
        <nav className="grid gap-2 p-4 text-lg font-medium">
            <Link href="/admin" className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Package2 className="h-6 w-6" />
                <span>WorkLocus</span>
            </Link>
            <MainNav isSidebarOpen={true} />
        </nav>
    );
}