"use client";

import { useState, useEffect, useCallback, type FC, type ReactNode } from "react";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";
import { vi } from "date-fns/locale"; // Thêm locale tiếng Việt
import { DateRange } from "react-day-picker"; // Thêm DateRange
import { TrendingUp, Users, CalendarIcon, CheckCircle, ArrowRight } from "lucide-react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Services & Types
import { getProjectsHealthApi, getEmployeeAverageHoursApi } from "@/services/admin.services";
import type { ProjectHealth, EmployeeAvgHours } from "@/services/admin.services";

// Custom Hook (không đổi)
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
            if (res.ok) setData(res.data.records); else setData([]);
        } catch (error) { console.error("Failed to fetch data:", error); setData([]); } 
        finally { setIsLoading(false); }
    }, [debouncedFilters, fetcher]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, isLoading, filters, setFilters };
}

// Component chính (không đổi)
export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Bảng điều khiển</h1>
            <ProjectHealthSection />
            <EmployeePerformanceSection />
        </div>
    );
}

// ProjectHealthSection (không đổi)
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


// === SỬA LẠI EMPLOYEE PERFORMANCE SECTION ===
function EmployeePerformanceSection() {
    type PerfFilters = { keyword: string; dateRange: DateRange | undefined };
    
    // Mặc định là tháng hiện tại
    const defaultDateRange: DateRange = {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    };
    
    const fetchFn = useCallback((filters: PerfFilters) => 
        getEmployeeAverageHoursApi({
            searchCondition: { keyword: filters.keyword },
            pageInfo: { pageNum: 1, pageSize: 5 },
            date_from: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
            date_to: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined
        }),
    []);
    const { data, isLoading, filters, setFilters } = useDashboardData<EmployeeAvgHours, PerfFilters>(fetchFn, { keyword: '', dateRange: defaultDateRange });

    return (
        <DashboardCard
            title="Hiệu suất Nhân viên"
            description="Giờ làm trung bình và các chỉ số hiệu suất khác của nhân viên."
            icon={<Users className="text-purple-500" />}
            filterControls={
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Tìm nhân viên..."
                        value={filters.keyword}
                        onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                        className="max-w-sm"
                    />
                    {/* <<< THAY THẾ 2 DATEPICKER BẰNG 1 DATERANGEPICKER >>> */}
                    <DateRangePicker 
                        date={filters.dateRange}
                        setDate={(range) => setFilters(prev => ({...prev, dateRange: range}))}
                    />
                </div>
            }
        >
            <Table>
                 <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nhân viên</TableHead>
                        <TableHead className="text-center">Số ngày làm</TableHead>
                        <TableHead className="text-center">Việc hoàn thành</TableHead>
                        <TableHead className="text-center">Giờ làm / ngày (TB)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRowSkeleton cols={4} /> : data.map((emp) => (
                        <TableRow key={emp._id}>
                            <TableCell className="font-medium">{emp.full_name}</TableCell>
                            <TableCell className="text-center">{emp.total_days_worked}</TableCell>
                            <TableCell className="text-center font-semibold text-green-600">
                                <div className="flex items-center justify-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    {emp.completed_tasks_count || 0}
                                </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-purple-600">{emp.average_hours.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </DashboardCard>
    );
}

// --- Helper Components ---

// <<< THÊM COMPONENT DATE RANGE PICKER MỚI >>>
interface DateRangePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    className?: string;
}
const DateRangePicker: FC<DateRangePickerProps> = ({ date, setDate, className }) => {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full md:w-[320px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-1 h-4 w-6 " />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "PP", { locale: vi })}
                                    <ArrowRight className="mx-2 h-4 w-4"/>
                                    {format(date.to, "PP", { locale: vi })}
                                </>
                            ) : (
                                format(date.from, "PP", { locale: vi })
                            )
                        ) : (
                            <span>Chọn khoảng ngày</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={vi}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};


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