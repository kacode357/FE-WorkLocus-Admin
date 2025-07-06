"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input"; // Vẫn giữ lại cho ô nhập số ngày
import { CurrencyInput } from "@/components/ui/currency-input"; // Component mới
import PayrollService from "@/services/payroll.services";
import type { User } from "./1-employee-selector";
import type { Review } from "./2-review-manager";
import { UpdateSalaryDialog } from "./update-salary-dialog";

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
});

export function PayrollCalculator({ user, review, month, year, onCalculationSuccess, onUserUpdate }: PayrollCalculatorProps) {
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diligence_required_days: 24,
      diligence_bonus_amount: 300000,
      other_bonus: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = { ...data, user_id: user._id, month, year };
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
          <CardDescription>Các thông số cuối cùng cho <strong>{user.full_name}</strong> - Tháng {month}/{year}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
                <p><strong>Lương cơ bản/ngày:</strong> {(user.base_salary_per_day || 0).toLocaleString('vi-VN')} VNĐ</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSalaryDialogOpen(true)}>
                    <Pencil className="h-4 w-4"/>
                </Button>
            </div>
            <p><strong>Đánh giá hiệu suất:</strong> Hạng {review.grade}</p>
          </div>
          <Separator className="my-4" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="diligence_required_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số ngày công yêu cầu</FormLabel>
                    <FormControl>
                      {/* Ô này không phải tiền nên dùng Input thường */}
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Xác nhận và Tính lương
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <UpdateSalaryDialog 
        user={user}
        isOpen={isSalaryDialogOpen}
        onOpenChange={setIsSalaryDialogOpen}
        onActionComplete={onUserUpdate}
      />
    </>
  );
}