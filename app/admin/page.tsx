"use client";

import { useState, useEffect, useCallback, type FC, type ReactNode } from "react";
import { useDebounce } from "use-debounce";
import { TrendingUp, BarChart2, Users } from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Services & Types
import { getProjectsHealthApi, getProjectTaskStatsApi, getEmployeeAverageHoursApi } from "@/services/admin.services";
import type { ProjectHealth, ProjectTaskStat, EmployeeAvgHours } from "@/services/admin.services";


// =================================================================
// --- CUSTOM HOOK ĐỂ TÁI SỬ DỤNG LOGIC GỌI API ---
// =================================================================
function useDashboardData<TData, TFilters>(
    fetcher: (filters: TFilters) => Promise<any>, 
    initialFilters: TFilters, 
    debounceTime: number = 500
) {
    const [data, setData] = useState<TData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<TFilters>(initialFilters);
    const [debouncedFilters] = useDebounce(filters, debounceTime);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetcher(debouncedFilters);
            if (res.ok) {
                setData(res.data.records);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedFilters, fetcher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, filters, setFilters };
}


// =================================================================
// --- COMPONENT CHÍNH CỦA TRANG ---
// =================================================================
export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Bảng điều khiển</h1>
            <ProjectHealthSection />
            <ProjectStatsSection />
            <EmployeePerformanceSection />
        </div>
    );
}


// =================================================================
// --- CÁC COMPONENT SECTION ---
// =================================================================

// --- SECTION 1: SỨC KHỎE DỰ ÁN ---
function ProjectHealthSection() {
    type HealthFilters = { keyword: string };
    
    const fetchFn = useCallback((filters: HealthFilters) => 
        getProjectsHealthApi({
            searchCondition: { keyword: filters.keyword },
            pageInfo: { pageNum: 1, pageSize: 5 }
        }), 
    []);
    const { data, isLoading, filters, setFilters } = useDashboardData<ProjectHealth, HealthFilters>(fetchFn, { keyword: '' });

    return (
        <DashboardCard
            title="Sức khỏe Dự án"
            description="Tổng quan nhanh về tiến độ các dự án đang hoạt động."
            icon={<TrendingUp className="text-blue-500" />}
            filterControls={
                <Input
                    placeholder="Tìm dự án..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
            }
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Tên dự án</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Tiến độ</TableHead>
                        <TableHead className="text-center">Task</TableHead>
                        <TableHead className="text-center">Member</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRowSkeleton cols={5} /> : data.map((p) => (
                        <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Progress value={p.progress_percentage} className="w-[80%]" />
                                    <span className="text-xs font-semibold">{Math.round(p.progress_percentage)}%</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">{p.total_tasks}</TableCell>
                            <TableCell className="text-center">{p.member_count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DashboardCard>
    );
}

// --- SECTION 2: THỐNG KÊ CÔNG VIỆC ---
function ProjectStatsSection() {
    type StatsFilters = { keyword: string };
    
    const fetchFn = useCallback((filters: StatsFilters) => 
        getProjectTaskStatsApi({
            searchCondition: { keyword: filters.keyword },
            pageInfo: { pageNum: 1, pageSize: 5 }
        }),
    []);
    const { data, isLoading, filters, setFilters } = useDashboardData<ProjectTaskStat, StatsFilters>(fetchFn, { keyword: '' });
    
    return (
        <DashboardCard
            title="Thống kê Công việc"
            description="Chi tiết số lượng công việc theo từng trạng thái của dự án."
            icon={<BarChart2 className="text-green-500" />}
            filterControls={
                 <Input
                    placeholder="Tìm dự án..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
            }
        >
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Tên dự án</TableHead>
                        <TableHead className="text-center text-green-500">Hoàn thành</TableHead>
                        <TableHead className="text-center text-blue-500">Đang làm</TableHead>
                        <TableHead className="text-center text-gray-500">Cần làm</TableHead>
                        <TableHead className="text-center font-bold">Tổng</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRowSkeleton cols={5} /> : data.map((p) => (
                        <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-center font-semibold text-green-600">{p.done}</TableCell>
                            <TableCell className="text-center font-semibold text-blue-600">{p.in_progress}</TableCell>
                            <TableCell className="text-center font-semibold text-gray-600">{p.todo}</TableCell>
                            <TableCell className="text-center font-extrabold">{p.total_tasks}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DashboardCard>
    );
}

// --- SECTION 3: HIỆU SUẤT NHÂN VIÊN ---
function EmployeePerformanceSection() {
    type PerfFilters = { keyword: string; from: string; to: string };
    
    const fetchFn = useCallback((filters: PerfFilters) => 
        getEmployeeAverageHoursApi({
            searchCondition: { keyword: filters.keyword },
            pageInfo: { pageNum: 1, pageSize: 5 },
            date_from: filters.from || undefined,
            date_to: filters.to || undefined
        }),
    []);
    const { data, isLoading, filters, setFilters } = useDashboardData<EmployeeAvgHours, PerfFilters>(fetchFn, { keyword: '', from: '', to: '' });

    return (
        <DashboardCard
            title="Hiệu suất Nhân viên"
            description="Giờ làm trung bình và số ngày làm việc của nhân viên."
            icon={<Users className="text-purple-500" />}
            filterControls={
                <div className="flex gap-2">
                    <Input
                        placeholder="Tìm nhân viên..."
                        value={filters.keyword}
                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        className="max-w-sm"
                    />
                    <Input type="date" value={filters.from} onChange={e => setFilters(prev => ({...prev, from: e.target.value}))} />
                    <Input type="date" value={filters.to} onChange={e => setFilters(prev => ({...prev, to: e.target.value}))} />
                </div>
            }
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nhân viên</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead className="text-center">Số ngày làm</TableHead>
                        <TableHead className="text-center">Giờ làm / ngày (TB)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRowSkeleton cols={4} /> : data.map((emp) => (
                        <TableRow key={emp._id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                            <TableCell className="text-center">{emp.total_days_worked}</TableCell>
                            <TableCell className="text-center font-bold text-purple-600">{emp.average_hours.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DashboardCard>
    );
}


// =================================================================
// --- CÁC COMPONENT HELPER (TÁI SỬ DỤNG) ---
// =================================================================

interface DashboardCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    filterControls: ReactNode;
    children: ReactNode;
}
const DashboardCard: FC<DashboardCardProps> = ({ title, description, icon, filterControls, children }) => (
    <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl">{icon} {title}</CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                </div>
                <div className="md:w-auto w-full">{filterControls}</div>
            </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const ProjectStatusBadge: FC<{ status: string }> = ({ status }) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-600 text-white hover:bg-green-700">Hoàn thành</Badge>;
        case 'in_progress': return <Badge variant="default">Đang chạy</Badge>;
        case 'on_hold': return <Badge variant="secondary">Tạm dừng</Badge>;
        case 'planning': return <Badge variant="outline">Lên kế hoạch</Badge>;
        default: return <Badge variant="destructive">{status}</Badge>;
    }
};

const TableRowSkeleton: FC<{ cols: number }> = ({ cols }) => (
    <>
        {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell colSpan={cols}>
                    <Skeleton className="h-8 w-full" />
                </TableCell>
            </TableRow>
        ))}
    </>
);