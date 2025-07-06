"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUserSalaryApi } from "@/services/admin.services";
import { CurrencyInput } from "@/components/ui/currency-input"; // Dùng component mới
import type { User } from "./1-employee-selector"; // Dùng lại type User

const formSchema = z.object({
  base_salary_per_day: z.coerce.number().min(0, "Lương phải là một số không âm."),
});

type UpdateSalaryFormValues = z.infer<typeof formSchema>;

interface UpdateSalaryDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function UpdateSalaryDialog({ user, isOpen, onOpenChange, onActionComplete }: UpdateSalaryDialogProps) {
  const form = useForm<UpdateSalaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      base_salary_per_day: 0,
    }
  });

  // Dùng `watch` để lấy giá trị hiện tại của field lương cho FormDescription
  const salaryValue = form.watch("base_salary_per_day");

  // Cập nhật giá trị form khi dialog mở hoặc user thay đổi
  useEffect(() => {
    if (isOpen) {
      form.reset({ base_salary_per_day: user.base_salary_per_day || 0 });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: UpdateSalaryFormValues) => {
    console.log("--- BẮT ĐẦU QUY TRÌNH UPDATE ---");
    console.log("1. [Dialog] Chuẩn bị gọi onActionComplete...");
    try {
      await updateUserSalaryApi(user._id, data);
      toast.success(`Cập nhật lương cho ${user.full_name} thành công!`);

      onActionComplete(); // Báo cho trang cha tải lại dữ liệu
      console.log("2. [Dialog] ĐÃ GỌI onActionComplete! Tín hiệu đã được gửi đi.");

      onOpenChange(false); // Đóng dialog
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật lương.");
      console.error("[Dialog] Lỗi, không gọi được onActionComplete", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật lương cơ bản</DialogTitle>
          <DialogDescription>
            Chỉnh sửa mức lương theo ngày cho nhân viên <strong>{user.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="base_salary_per_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lương cơ bản / ngày (VND)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onValueChange={field.onChange} ref={field.ref} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}