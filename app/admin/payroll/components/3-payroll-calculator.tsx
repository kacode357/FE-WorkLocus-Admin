"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Pencil, Loader2, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import PayrollService from "@/services/payroll.services";
import type { User } from "./1-employee-selector";
import type { Review } from "./2-review-manager";
import { UpdateSalaryDialog } from "./update-salary-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PayrollCalculatorProps {
  user: User;
  review: Review;
  month: number;
  year: number;
  onCalculationSuccess: (payrollResult: any) => void;
  onUserUpdate: () => void;
}

const formSchema = z.object({
  diligence_required_days: z.coerce.number().min(0, "Số ngày phải lớn hơn hoặc bằng 0."),
  diligence_bonus_amount: z.coerce.number().min(0, "Tiền thưởng phải lớn hơn hoặc bằng 0."),
  other_bonus: z.coerce.number().optional(),
  ot_coefficient: z.coerce.number().min(1).max(3).default(1.2).optional(),
  dev_mode: z.boolean().optional(),
});

export function PayrollCalculator({
  user,
  review,
  month,
  year,
  onCalculationSuccess,
  onUserUpdate,
}: PayrollCalculatorProps) {
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);

  // State cho modal xem ngày công
  const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diligence_required_days: 24,
      diligence_bonus_amount: 300000,
      other_bonus: 0,
      ot_coefficient: 1.2,
      dev_mode: false,
    },
  });

  // Xem chi tiết ngày công
  const handleViewAttendanceSummary = async () => {
    setLoadingAttendance(true);
    setAttendanceModalOpen(true);
    try {
      const from = `${year}-${month.toString().padStart(2, "0")}-01`;
      const to = `${year}-${month.toString().padStart(2, "0")}-31`;
      const res = await PayrollService.getUserAttendanceSummary(user._id, from, to);
      setAttendanceSummary(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không lấy được thống kê công.");
      setAttendanceSummary(null);
    }
    setLoadingAttendance(false);
  };

  // Tính lương
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...data,
        user_id: user._id,
        month,
        year,
        ot_coefficient: data.ot_coefficient,
        dev_mode: data.dev_mode,
      };
      const response = await PayrollService.calculatePayroll(payload);

      toast.success(`Đã tính và gửi bảng lương cho ${user.full_name}.`);
      onCalculationSuccess(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tính lương.");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardDescription>
            Các thông số cuối cùng cho <strong>{user.full_name}</strong> - Tháng {month}/{year}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {/* Đây là phần tao đã chỉnh sửa */}
            <div className="flex items-center justify-between">
              <p>
                <strong>Lương cơ bản/ngày:</strong>{" "}
                {(user.base_salary_per_day || 0).toLocaleString("vi-VN")} VNĐ
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsSalaryDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p>
              <strong>Đánh giá hiệu suất:</strong> Hạng {review.grade}
            </p>
            {/* Tao thêm cái nút vào đây */}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full justify-start bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
              onClick={handleViewAttendanceSummary}
            >
              <Info className="w-4 h-4 mr-2 text-orange-500" />
              Xem chi tiết ngày công
            </Button>
          </div>
          <Separator className="my-4" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Giữ nguyên các FormField ở dưới đây */}
              <FormField
                control={form.control}
                name="diligence_required_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số ngày công yêu cầu</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diligence_bonus_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiền thưởng chuyên cần (VNĐ)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onValueChange={field.onChange} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other_bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thưởng / Phụ cấp khác (VNĐ)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value || 0} onValueChange={field.onChange} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ot_coefficient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hệ số OT (mặc định 1.2)</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dev_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                      {" "}Chỉ tính ngày có điểm danh (không cần chờ hết tháng)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận và Tính lương
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/*... (giữ nguyên các component dialog ở dưới) */}
      <UpdateSalaryDialog
        user={user}
        isOpen={isSalaryDialogOpen}
        onOpenChange={setIsSalaryDialogOpen}
        onActionComplete={onUserUpdate}
      />

      <Dialog open={isAttendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent
          className="max-h-[90vh] min-w-[1100px] w-full overflow-y-auto"
          style={{ maxWidth: "1100px", width: "90vw" }}
        >
          <DialogHeader>
            <DialogTitle>Chi tiết ngày công tháng {month}/{year}</DialogTitle>
            <DialogDescription>
              {loadingAttendance ? "Đang tải..." : "Đầy đủ chi tiết ngày công, giờ làm và đi trễ"}
            </DialogDescription>
          </DialogHeader>

          {attendanceSummary && (
            <div className="mt-2 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Số ngày công:</strong> {attendanceSummary.total_days_worked}</div>
                <div><strong>Tổng giờ làm:</strong> {attendanceSummary.total_hours_worked}</div>
                <div><strong>Trung bình/ngày:</strong> {attendanceSummary.average_hours_per_day}</div>
                <div><strong>Số lần đi trễ:</strong> {attendanceSummary.lateness_count}</div>
                <div><strong>Số ngày có đi trễ:</strong> {attendanceSummary.lateness_days}</div>
              </div>

              <div>
                <strong>Chi tiết các lần đi trễ:</strong>
                {attendanceSummary.lateness_details?.length > 0 ? (
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    {attendanceSummary.lateness_details.map((item: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-medium">{new Date(item.date).toLocaleDateString("vi-VN")}</span>
                        {" - "}
                        <span>{item.shift === "morning" ? "Sáng" : "Chiều"}</span>
                        {": "}
                        <span>
                          {item.time ? new Date(item.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                        </span>
                        {" "}
                        <span className="italic text-xs text-red-500">
                          {item.late_type === "late-morning" ? "(Trễ sáng)" : "(Trễ chiều)"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground text-xs">Không có lần đi trễ nào.</div>
                )}
              </div>

              <div>
                <strong>Bảng chi tiết từng ngày:</strong>
                <div className="overflow-auto max-h-[40vh] min-w-[1000px] border rounded">
                  <table className="min-w-full text-xs border">
                    <thead>
                      <tr className="bg-muted sticky top-0">
                        <th className="px-2 py-1 border">Ngày</th>
                        <th className="px-2 py-1 border">Giờ làm</th>
                        <th className="px-2 py-1 border">Checkin sáng</th>
                        <th className="px-2 py-1 border">Checkout sáng</th>
                        <th className="px-2 py-1 border">Checkin chiều</th>
                        <th className="px-2 py-1 border">Checkout chiều</th>
                        <th className="px-2 py-1 border">Trễ sáng</th>
                        <th className="px-2 py-1 border">Trễ chiều</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSummary.details?.map((d: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1 border">
                            {new Date(d.date).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-2 py-1 border">
                            {typeof d.hours === "number"
                              ? d.hours.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : d.hours}
                          </td>
                          <td className="px-2 py-1 border">
                            {d.checkin_morning ? new Date(d.checkin_morning).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </td>
                          <td className="px-2 py-1 border">
                            {d.checkout_morning ? new Date(d.checkout_morning).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </td>
                          <td className="px-2 py-1 border">
                            {d.checkin_afternoon ? new Date(d.checkin_afternoon).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </td>
                          <td className="px-2 py-1 border">
                            {d.checkout_afternoon ? new Date(d.checkout_afternoon).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </td>
                          <td className="px-2 py-1 border text-center">
                            {d.is_late_morning ? <span className="text-red-500 font-bold">✓</span> : ""}
                          </td>
                          <td className="px-2 py-1 border text-center">
                            {d.is_late_afternoon ? <span className="text-red-500 font-bold">✓</span> : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}