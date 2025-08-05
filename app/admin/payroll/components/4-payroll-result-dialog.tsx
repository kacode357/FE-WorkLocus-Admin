"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface PayrollResultDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payrollResult: any;
}

export function PayrollResultDialog({ isOpen, onOpenChange, payrollResult }: PayrollResultDialogProps) {
  if (!payrollResult) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);

  const createdAt = payrollResult.created_at
    ? new Date(payrollResult.created_at).toLocaleString("vi-VN", { hour12: false })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl min-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Bảng lương chi tiết - Tháng {payrollResult.month}/{payrollResult.year}
          </DialogTitle>
          <DialogDescription>
            Nhân viên: <strong>{payrollResult.user_id?.full_name}</strong>
            {payrollResult.user_id?.email && (
              <>
                <br />
                Email: <span className="text-muted-foreground">{payrollResult.user_id.email}</span>
              </>
            )}
            {createdAt && (
              <>
                <br />
                Ngày tạo: <span className="text-muted-foreground">{createdAt}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-3" />
        <div className="py-2">
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
              {"diligence_required_days" in payrollResult ? (
                <TableRow>
                  <TableCell>Thưởng chuyên cần (yêu cầu {payrollResult.diligence_required_days} ngày)</TableCell>
                  <TableCell className="text-right text-green-600">
                    + {formatCurrency(payrollResult.diligence_bonus)}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>Thưởng chuyên cần</TableCell>
                  <TableCell className="text-right text-green-600">
                    + {formatCurrency(payrollResult.diligence_bonus)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>Thưởng/Phạt hiệu suất</TableCell>
                <TableCell className={`text-right ${payrollResult.performance_bonus < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {payrollResult.performance_bonus >= 0 ? '+ ' : ''}
                  {formatCurrency(payrollResult.performance_bonus)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Phụ cấp khác</TableCell>
                <TableCell className="text-right text-green-600">
                  + {formatCurrency(payrollResult.other_bonus)}
                </TableCell>
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
