"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Wallet } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import DashboardService from "@/services/dashboard.services";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function PayrollHistoryPage() {
  /* ----------------------- STATE ------------------------------------ */
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalRecords: 0
  });

  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ----------------------- FETCH ------------------------------------ */
  const fetchPayrolls = useCallback(
    async (keyword: string, page: number, m: number, y: number) => {
      setIsLoading(true);
      try {
        const res = await DashboardService.searchRecentPayrolls({
          searchCondition: { keyword, month: m, year: y },
          pageInfo: { pageNum: page, pageSize: 10 }
        });

        if (res?.ok) {
          setPayrolls(res.data?.records || []);
          setPagination(res.data?.pagination || pagination);
        } else {
          setPayrolls([]);
        }
      } catch (err) {
        console.error("Lỗi load payroll:", err);
        setPayrolls([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /* debounce search / filter */
  useEffect(() => {
    const t = setTimeout(() => fetchPayrolls(searchTerm, 1, month, year), 300);
    return () => clearTimeout(t);
  }, [searchTerm, month, year, fetchPayrolls]);

  const openDetail = (p: any) => {
    setSelectedPayroll(p);
    setDialogOpen(true);
  };

  /* ----------------------- RENDER ----------------------------------- */
  return (
    <div className="space-y-4">
      {/* CARD WRAPPER */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Lịch sử Bảng lương
              </CardTitle>
              <CardDescription>
                Tra cứu và xem chi tiết các bảng lương đã chốt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* SEARCH + FILTER */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo tên nhân viên…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={12}
                placeholder="Tháng"
                value={month}
                onChange={(e) => setMonth(+e.target.value)}
                className="w-24"
              />
              <Input
                type="number"
                min={2020}
                placeholder="Năm"
                value={year}
                onChange={(e) => setYear(+e.target.value)}
                className="w-28"
              />
            </div>
          </div>

          {/* TABLE */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-orange-500">Nhân viên</TableHead>
                <TableHead className="text-right text-orange-500">Thực lãnh</TableHead>
                <TableHead className="text-center text-orange-500">Hành&nbsp;động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : payrolls.length ? (
                payrolls.map(p => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div className="font-medium">{p.user_id?.full_name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        Tháng {p.month}/{p.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(p.total_salary)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(p)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    Không có dữ liệu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* TODO: Pagination controls nếu cần */}
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      {selectedPayroll && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-orange-600">
                Bảng lương {selectedPayroll.month}/{selectedPayroll.year}
              </DialogTitle>
              <DialogDescription>
                Nhân viên: {selectedPayroll.user_id?.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-sm">
              <div className="grid grid-cols-2">
                <span>Ngày công:</span>
                <span>{selectedPayroll.working_days} ngày</span>
              </div>
              <div className="grid grid-cols-2">
                <span>Lương/ngày:</span>
                <span>{formatCurrency(selectedPayroll.base_salary_per_day)}</span>
              </div>

              <hr />

              <div className="grid grid-cols-2">
                <span>Tổng lương cơ bản:</span>
                <span>{formatCurrency(selectedPayroll.base_salary)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span>Thưởng chuyên cần:</span>
                <span className="text-green-600 font-semibold">
                  + {formatCurrency(selectedPayroll.diligence_bonus)}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span>Thưởng hiệu suất:</span>
                <span className="text-green-600 font-semibold">
                  + {formatCurrency(selectedPayroll.performance_bonus)}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span>Phụ cấp khác:</span>
                <span className="text-green-600 font-semibold">
                  + {formatCurrency(selectedPayroll.other_bonus)}
                </span>
              </div>

              {/* OT: hai dòng riêng */}
              <div className="grid grid-cols-2">
                <span>Số giờ OT:</span>
                <span>{(selectedPayroll.ot_hours ?? 0).toFixed(2)} h</span>
              </div>
              <div className="grid grid-cols-2">
                <span>Tiền OT:</span>
                <span className="text-green-600 font-semibold">
                  + {formatCurrency(selectedPayroll.ot_salary ?? 0)}
                </span>
              </div>

              <hr />

              <div className="grid grid-cols-2 font-bold text-lg text-orange-700">
                <span>Thực lãnh:</span>
                <span>{formatCurrency(selectedPayroll.total_salary)}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
