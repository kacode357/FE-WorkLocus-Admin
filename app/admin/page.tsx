"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Package, ClipboardList, Wallet, Search, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import DashboardService from "@/services/dashboard.services";
import type { DashboardStats } from "@/services/dashboard.services";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);

    const fetchPayrolls = useCallback(async (keyword: string, page: number) => {
        setIsPayrollLoading(true);
        try {
            const now = new Date();
            const payrollResponse = await DashboardService.searchRecentPayrolls({
                searchCondition: {
                    keyword: keyword,
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                },
                pageInfo: {
                    pageNum: page,
                    pageSize: 5
                }
            });

            if (payrollResponse && payrollResponse.ok) {
                setPayrolls(payrollResponse.data?.records || []);
            } else {
                setPayrolls([]);
                console.warn("API payroll/search trả về không OK hoặc không có dữ liệu:", payrollResponse);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu bảng lương:", error);
            setPayrolls([]);
        } finally {
            setIsPayrollLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const statsResponse = await DashboardService.getDashboardStats();
                if (statsResponse && statsResponse.ok) {
                    setStats(statsResponse.data);
                } else {
                    setStats(null);
                    console.warn("API dashboard-stats trả về không OK hoặc không có dữ liệu:", statsResponse);
                }
                await fetchPayrolls('', 1);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard tổng thể:", error);
                setStats(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [fetchPayrolls]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1);
            fetchPayrolls(searchTerm, 1);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, fetchPayrolls]);

    const handleViewDetails = (payroll: any) => {
        setSelectedPayroll(payroll);
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
        setSelectedPayroll(null);
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!stats) {
        return <div className="text-center p-8 text-red-600">Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tổng Nhân viên" value={(stats.employeeCount || 0) + (stats.adminCount || 0)} icon={<Users className="text-orange-500" />} />
                <StatCard title="Dự án" value={stats.projectCount || 0} icon={<Package className="text-orange-500" />} />
                <StatCard title="Công việc" value={stats.taskCount || 0} icon={<ClipboardList className="text-orange-500" />} />
                <StatCard title="Tổng lương đã trả" value={formatCurrency(stats.totalSalaryPaid || 0)} icon={<Wallet className="text-orange-500" />} />
            </div>

            <div className="grid grid-cols-1">
                <Card className="lg:col-span-1 border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-600">Bảng lương gần đây</CardTitle>
                        <CardDescription>
                            {isPayrollLoading ? "Đang tải..." : "5 bảng lương được tính toán gần nhất trong tháng."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Tìm kiếm theo tên nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-orange-500">Nhân viên</TableHead>
                                    <TableHead className="text-right text-orange-500">Thực lãnh</TableHead>
                                    <TableHead className="text-center text-orange-500">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isPayrollLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-gray-500">Đang tải bảng lương...</TableCell>
                                    </TableRow>
                                ) : payrolls.length > 0 ? (
                                    payrolls.map(p => (
                                        <TableRow key={p._id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-800">{p.user_id?.full_name || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">Tháng {p.month || 'N/A'}/{p.year || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">{formatCurrency(p.total_salary || 0)}</TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                                    onClick={() => handleViewDetails(p)}
                                                >
                                                    Xem chi tiết
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                                            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có dữ liệu bảng lương trong tháng này."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* POPUP XEM CHI TIẾT LƯƠNG ĐÃ ĐƯỢC GỌN HƠN */}
            {selectedPayroll && (
                <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-orange-600">Chi tiết lương tháng {selectedPayroll.month || 'N/A'}/{selectedPayroll.year || 'N/A'}</DialogTitle>
                            <DialogDescription className="mt-1 text-gray-600">
                                Lương của {selectedPayroll.user_id?.full_name || 'N/A'}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4 text-gray-700"> {/* Giảm gap cho gọn */}
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Email:</span>
                                <span>{selectedPayroll.user_id?.email || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Vai trò:</span>
                                <span>{selectedPayroll.user_id?.role || 'N/A'}</span>
                            </div>
                            <hr className="my-2 border-gray-200" /> {/* Giảm margin */}
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Ngày công:</span>
                                <span>{selectedPayroll.working_days || 0} ngày</span> {/* Thêm đơn vị */}
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Lương cơ bản/ngày:</span>
                                <span>{formatCurrency(selectedPayroll.base_salary_per_day || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Tổng lương cơ bản:</span>
                                <span>{formatCurrency(selectedPayroll.base_salary || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Thưởng chuyên cần:</span>
                                <span>{formatCurrency(selectedPayroll.diligence_bonus || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Thưởng hiệu suất:</span>
                                <span>{formatCurrency(selectedPayroll.performance_bonus || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <span className="font-semibold text-gray-800">Thưởng khác:</span>
                                <span>{formatCurrency(selectedPayroll.other_bonus || 0)}</span>
                            </div>
                            <hr className="my-2 border-orange-300" /> {/* Đổi màu đường kẻ */}
                            <div className="grid grid-cols-2 items-center gap-2 text-lg font-bold text-orange-700">
                                <span>Thực lãnh:</span>
                                <span>{formatCurrency(selectedPayroll.total_salary || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Ngày tạo bảng lương:</span>
                                <span>{selectedPayroll.created_at ? new Date(selectedPayroll.created_at).toLocaleDateString('vi-VN') : 'N/A'}</span>
                            </div>
                        </div>
                        <Button
                            onClick={handleClosePopup}
                            variant="secondary"
                            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                            Đóng
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// --- CÁC COMPONENT PHỤ GIỮ NGUYÊN ---
function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
    return (
        <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">{title}</CardTitle>
                <div className="text-orange-500">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1">
                <Skeleton className="h-[400px]" />
            </div>
        </div>
    );
}