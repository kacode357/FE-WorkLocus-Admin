"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Package, ClipboardList, Wallet, BarChart4, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell } from "recharts";
import DashboardService from "@/services/dashboard.services";
import type { DashboardStats } from "@/services/dashboard.services";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Định nghĩa màu sắc cho biểu đồ - TONE MÀU CÓ ĐỘ TƯƠNG PHẢN CAO HƠN
// Mày có thể chỉnh sửa các mã màu HEX này để đạt được hiệu ứng mong muốn
const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA800', '#C70039']; // Đỏ san hô, Xanh ngọc, Xanh da trời, Cam sáng, Đỏ sẫm

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayrollLoading, setIsPayrollLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    // Hàm fetch bảng lương có thể tái sử dụng
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

            if (payrollResponse.ok) {
                setPayrolls(payrollResponse.data.records);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu bảng lương:", error);
            setPayrolls([]);
        } finally {
            setIsPayrollLoading(false);
        }
    }, []);

    // useEffect để fetch dữ liệu dashboard và bảng lương ban đầu
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const statsResponse = await DashboardService.getDashboardStats();
                if (statsResponse.ok) {
                    setStats(statsResponse.data);
                }
                await fetchPayrolls('', 1);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard tổng thể:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [fetchPayrolls]);

    // useEffect để gọi API khi searchTerm thay đổi
    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1);
            fetchPayrolls(searchTerm, 1);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, fetchPayrolls]);

    const chartData = stats ? [
        { name: 'diligence', label: 'Chuyên cần', value: stats.totalDiligenceBonusPaid },
        { name: 'performance', label: 'Hiệu suất', value: stats.totalPerformanceBonusPaid },
        { name: 'other', label: 'Khác', value: stats.totalOtherBonusPaid },
    ].filter(item => item.value > 0) : [];

    // Component CustomTooltip mới để định dạng tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-md border bg-white p-2 text-sm shadow-md">
                    <p className="font-semibold text-gray-800">{data.label}:</p>
                    <p className="text-gray-700">{formatCurrency(data.value)}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!stats) {
        return <div className="text-center">Không thể tải dữ liệu dashboard.</div>;
    }

    return (
        <div className="space-y-4 ">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tổng Nhân viên" value={stats.employeeCount + stats.adminCount} icon={<Users className="text-orange-500" />} />
                <StatCard title="Dự án" value={stats.projectCount} icon={<Package className="text-orange-500" />} />
                <StatCard title="Công việc" value={stats.taskCount} icon={<ClipboardList className="text-orange-500" />} />
                <StatCard title="Tổng lương đã trả" value={formatCurrency(stats.totalSalaryPaid)} icon={<Wallet className="text-orange-500" />} />
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3 border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <BarChart4 className="h-5 w-5 text-orange-500"/>
                            Cơ cấu Thưởng/Phụ cấp
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={{
                                diligence: { label: 'Chuyên cần', color: CHART_COLORS[0] },
                                performance: { label: 'Hiệu suất', color: CHART_COLORS[1] },
                                other: { label: 'Khác', color: CHART_COLORS[2] },
                            }}
                            className="mx-auto aspect-square h-[300px]"
                        >
                            <PieChart>
                                {/* SỬ DỤNG CUSTOM TOOLTIP Ở ĐÂY */}
                                <ChartTooltip content={<CustomTooltip />} />
                                <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={60} strokeWidth={5}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <ChartLegend content={({ payload }) => <ChartLegendContent payload={payload} nameKey="label" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-600">Bảng lương gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Thanh tìm kiếm */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Tìm kiếm theo tên nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                            />
                        </div>
                        {/* End Thanh tìm kiếm */}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-orange-500">Nhân viên</TableHead>
                                    <TableHead className="text-right text-orange-500">Thực lãnh</TableHead>
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
                                                <div className="text-xs text-muted-foreground">Tháng {p.month}/{p.year}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">{formatCurrency(p.total_salary)}</TableCell>
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
            <div className="grid gap-8 md:grid-cols-2 lg:col-span-5">
                <Skeleton className="lg:col-span-3 h-[400px]" />
                <Skeleton className="lg:col-span-2 h-[400px]" />
            </div>
        </div>
    );
}