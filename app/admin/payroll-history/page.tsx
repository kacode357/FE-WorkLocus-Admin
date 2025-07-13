"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DashboardService from "@/services/dashboard.services";

// Các component con và hàm tiện ích có thể copy từ trang dashboard cũ
const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function PayrollHistoryPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Thêm state cho bộ lọc tháng và năm
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);

    const fetchPayrolls = useCallback(async (keyword: string, page: number, currentMonth: number, currentYear: number) => {
        setIsLoading(true);
        try {
            const payrollResponse = await DashboardService.searchRecentPayrolls({
                searchCondition: {
                    keyword: keyword,
                    month: currentMonth,
                    year: currentYear
                },
                pageInfo: {
                    pageNum: page,
                    pageSize: 10 // Hiển thị 10 record mỗi trang
                }
            });

            if (payrollResponse?.ok) {
                setPayrolls(payrollResponse.data?.records || []);
                setPagination(payrollResponse.data?.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0 });
            } else {
                setPayrolls([]);
                console.warn("API payroll/search trả về không OK:", payrollResponse);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu bảng lương:", error);
            setPayrolls([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchPayrolls(searchTerm, 1, month, year);
        }, 300); // Debounce search

        return () => clearTimeout(handler);
    }, [searchTerm, month, year, fetchPayrolls]);

    const handleViewDetails = (payroll: any) => {
        setSelectedPayroll(payroll);
        setIsPopupOpen(true);
    };

    return (
        <div className="space-y-4">
            <Card className="border-orange-200">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-orange-600 flex items-center gap-2">
                                <Wallet /> Lịch sử Bảng lương
                            </CardTitle>
                            <CardDescription>
                                Xem lại và tìm kiếm các bảng lương đã được tính toán.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-2 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Tìm theo tên nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Tháng"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-24"
                            />
                            <Input
                                type="number"
                                placeholder="Năm"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-28"
                            />
                        </div>
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
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center h-24">Đang tải...</TableCell></TableRow>
                            ) : payrolls.length > 0 ? (
                                payrolls.map(p => (
                                    <TableRow key={p._id}>
                                        <TableCell>
                                            <div className="font-medium">{p.user_id?.full_name || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">Tháng {p.month}/{p.year}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(p.total_salary || 0)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(p)}>
                                                Xem chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="text-center h-24">Không có dữ liệu.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {/* Thêm phân trang nếu cần */}
                </CardContent>
            </Card>

            {/* Popup Dialog */}
            {selectedPayroll && (
                <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                    <DialogContent>
                        {/* Copy JSX của DialogContent từ file page.tsx cũ vào đây */}
                        <DialogHeader>
                            <DialogTitle className="text-orange-600">Chi tiết lương tháng {selectedPayroll.month}/{selectedPayroll.year}</DialogTitle>
                            <DialogDescription>Lương của {selectedPayroll.user_id?.full_name}.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4 text-sm">
                            <div className="grid grid-cols-2"><span>Ngày công:</span><span>{selectedPayroll.working_days || 0} ngày</span></div>
                            <div className="grid grid-cols-2"><span>Lương/ngày:</span><span>{formatCurrency(selectedPayroll.base_salary_per_day || 0)}</span></div>
                            <hr />
                            <div className="grid grid-cols-2"><span>Tổng lương cơ bản:</span><span>{formatCurrency(selectedPayroll.base_salary || 0)}</span></div>
                            <div className="grid grid-cols-2"><span>Thưởng chuyên cần:</span><span className="text-green-600">+ {formatCurrency(selectedPayroll.diligence_bonus || 0)}</span></div>
                            <div className="grid grid-cols-2"><span>Thưởng hiệu suất:</span><span className="text-green-600">+ {formatCurrency(selectedPayroll.performance_bonus || 0)}</span></div>
                            <div className="grid grid-cols-2"><span>Thưởng khác:</span><span className="text-green-600">+ {formatCurrency(selectedPayroll.other_bonus || 0)}</span></div>
                            <hr />
                            <div className="grid grid-cols-2 font-bold text-lg text-orange-700"><span>Thực lãnh:</span><span>{formatCurrency(selectedPayroll.total_salary || 0)}</span></div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}