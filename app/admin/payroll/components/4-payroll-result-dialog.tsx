"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface PayrollResultDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payrollResult: any; // Kiểu dữ liệu của kết quả lương
}

export function PayrollResultDialog({ isOpen, onOpenChange, payrollResult }: PayrollResultDialogProps) {
  if (!payrollResult) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bảng lương chi tiết - Tháng {payrollResult.month}/{payrollResult.year}</DialogTitle>
          <DialogDescription>
            Bảng lương cho nhân viên <strong>{payrollResult.user_id.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diễn giải</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Đơn giá lương ngày</TableCell>
                <TableCell className="text-right">{formatCurrency(payrollResult.base_salary_per_day)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Số ngày công</TableCell>
                <TableCell className="text-right">{payrollResult.working_days} ngày</TableCell>
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Lương cơ bản</TableCell>
                <TableCell className="text-right">{formatCurrency(payrollResult.base_salary)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Thưởng chuyên cần (yêu cầu {payrollResult.diligence_required_days} ngày)</TableCell>
                <TableCell className="text-right text-green-600">+ {formatCurrency(payrollResult.diligence_bonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Thưởng/Phạt hiệu suất</TableCell>
                <TableCell className={`text-right ${payrollResult.performance_bonus < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {payrollResult.performance_bonus >= 0 ? '+ ' : ''}{formatCurrency(payrollResult.performance_bonus)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Phụ cấp khác</TableCell>
                <TableCell className="text-right text-green-600">+ {formatCurrency(payrollResult.other_bonus)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted font-bold text-lg">
                <TableCell>TỔNG THỰC LÃNH</TableCell>
                <TableCell className="text-right">{formatCurrency(payrollResult.total_salary)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}