"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Package, ClipboardList, Wallet, Search } from "lucide-react"; // Bỏ BarChart4 vì không dùng nữa
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Bỏ các imports liên quan đến chart
// import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
// Bỏ PieChart, Pie, Cell
// import { PieChart, Pie, Cell } from "recharts";
import DashboardService from "@/services/dashboard.services";
import type { DashboardStats } from "@/services/dashboard.services";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Mảng màu biểu đồ không cần nữa vì không dùng biểu đồ
// const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA800', '#C70039'];

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

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

    // chartData và CustomTooltip không cần nữa vì không dùng biểu đồ
    // const chartData = stats ? [
    //     { name: 'diligence', label: 'Chuyên cần', value: stats.totalDiligenceBonusPaid || 0 },
    //     { name: 'performance', label: 'Hiệu suất', value: stats.totalPerformanceBonusPaid || 0 },
    //     { name: 'other', label: 'Khác', value: stats.totalOtherBonusPaid || 0 },
    // ].filter(item => item.value > 0) : [];

    // const CustomTooltip = ({ active, payload }: any) => {
    //     if (active && payload && payload.length) {
    //         const data = payload[0].payload;
    //         return (
    //             <div className="rounded-md border bg-white p-2 text-sm shadow-md">
    //                 <p className="font-semibold text-gray-800">{data.label}:</p>
    //                 <p className="text-gray-700">{formatCurrency(data.value)}</p>
    //             </div>
    //         );
    //     }
    //     return null;
    // };

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

            {/* BỐ CỤC MỚI: Nếu không có biểu đồ, phần này sẽ chỉ còn bảng lương */}
            {/* Thay vì grid lg:grid-cols-5, giờ chỉ cần lg:col-span-12 hoặc không cần grid nếu chỉ có 1 phần tử chính */}
            <div className="grid grid-cols-1"> {/* Đổi sang grid 1 cột nếu chỉ còn 1 card chính */}
                <Card className="lg:col-span-1 border-orange-200"> {/* Card bảng lương sẽ chiếm toàn bộ chiều rộng */}
                    <CardHeader>
                        <CardTitle className="text-orange-600">Bảng lương gần đây</CardTitle>
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
                                    <TableHead className="text-orange-500">Nhân viên</TableHead><TableHead className="text-right text-orange-500">Thực lãnh</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isPayrollLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-gray-500">Đang tải bảng lương...</TableCell>
                                    </TableRow>
                                ) : payrolls.length > 0 ? (
                                    payrolls.map(p => (
                                        <TableRow key={p._id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-800">{p.user_id?.full_name || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">Tháng {p.month || 'N/A'}/{p.year || 'N/A'}</div>
                                            </TableCell><TableCell className="text-right font-semibold text-green-600">{formatCurrency(p.total_salary || 0)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-gray-500">
                                            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có dữ liệu bảng lương trong tháng này."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
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
            {/* Skeleton cho phần không còn biểu đồ, giờ chỉ còn 1 cột */}
            <div className="grid grid-cols-1">
                <Skeleton className="h-[400px]" /> {/* Skeleton cho Card bảng lương */}
            </div>
        </div>
    );
}