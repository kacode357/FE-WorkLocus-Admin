"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import BonusService from "@/services/bonus.services";

// Định nghĩa lại type Bonus để dùng làm prop
export interface Bonus {
  _id: string;
  grade: string;
  bonus_amount: number;
  description: string;
}

const formSchema = z.object({
  grade: z.string().min(1, "Vui lòng nhập Xếp loại."),
  // Dùng coerce để tự động chuyển đổi giá trị nhập vào (string) thành số
  bonus_amount: z.coerce.number().int("Vui lòng nhập số nguyên."),
  description: z.string().min(5, "Mô tả phải có ít nhất 5 ký tự."),
});

type BonusFormValues = z.infer<typeof formSchema>;

interface BonusFormDialogProps {
  bonus?: Bonus; // Nếu có -> Sửa, không có -> Tạo
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function BonusFormDialog({ bonus, isOpen, onOpenChange, onActionComplete }: BonusFormDialogProps) {
  const isEditMode = !!bonus;

  const form = useForm<BonusFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      bonus_amount: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Khi mở dialog, reset form với giá trị của bonus nếu là chế độ sửa
      form.reset(isEditMode ? bonus : { grade: "", bonus_amount: 0, description: "" });
    }
  }, [isOpen, isEditMode, bonus, form]);

  const onSubmit = async (data: BonusFormValues) => {
    try {
      if (isEditMode) {
        await BonusService.updateBonus(bonus._id, data);
        toast.success("Cập nhật mức thưởng thành công!");
      } else {
        await BonusService.createBonus(data);
        toast.success("Tạo mức thưởng mới thành công!");
      }
      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Chỉnh sửa" : "Tạo mới"} Mức thưởng/phạt</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Cập nhật thông tin cho mức thưởng." : "Thêm một mức thưởng/phạt mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem><FormLabel>Xếp loại (Grade)</FormLabel><FormControl><Input placeholder="A, B, C, D..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bonus_amount" render={({ field }) => (
              <FormItem><FormLabel>Mức thưởng / phạt (VND)</FormLabel><FormControl><Input type="number" placeholder="Nhập số âm để phạt. VD: -200000" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea placeholder="Mô tả chi tiết..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Lưu thay đổi" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}