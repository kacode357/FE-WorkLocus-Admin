"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function PayrollResultPanel({ payroll }: { payroll: any }) {
  if (!payroll) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const otHours  = typeof payroll.ot_hours  === "number" ? payroll.ot_hours.toFixed(2) : "0.00";
  const otSalary = typeof payroll.ot_salary === "number" ? formatCurrency(payroll.ot_salary) : formatCurrency(0);

  /* class dùng cho dòng có số + tiền (nổi bật màu xanh & in đậm) */
  const plusClass = "text-green-600 font-semibold";

  return (
    <Card className="mt-4 bg-muted/40 border border-dashed shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-center">
          Kết quả lương tháng {payroll.month}/{payroll.year}
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Xem nhanh bảng lương vừa tính
        </p>
      </CardHeader>

      <CardContent className="px-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Đơn giá/ngày</TableCell>
              <TableCell className="text-right">
                {formatCurrency(payroll.base_salary_per_day)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Số ngày công</TableCell>
              <TableCell className="text-right">
                {payroll.working_days} ngày
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Lương cơ bản</TableCell>
              <TableCell className="text-right">
                {formatCurrency(payroll.base_salary)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Thưởng chuyên cần</TableCell>
              <TableCell className={`text-right ${plusClass}`}>
                + {formatCurrency(payroll.diligence_bonus)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Thưởng hiệu suất</TableCell>
              <TableCell className={`text-right ${plusClass}`}>
                + {formatCurrency(payroll.performance_bonus)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Phụ cấp khác</TableCell>
              <TableCell className={`text-right ${plusClass}`}>
                + {formatCurrency(payroll.other_bonus)}
              </TableCell>
            </TableRow>

            {/* OT tách 2 dòng */}
            <TableRow>
              <TableCell>Số giờ làm thêm</TableCell>
              <TableCell className="text-right">{otHours} h</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Tiền làm thêm giờ</TableCell>
              <TableCell className={`text-right ${plusClass}`}>
                + {otSalary}
              </TableCell>
            </TableRow>

            {/* Tổng */}
            <TableRow className="bg-muted font-semibold text-base">
              <TableCell>Tổng thực lãnh</TableCell>
              <TableCell className="text-right">
                {formatCurrency(payroll.total_salary)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
