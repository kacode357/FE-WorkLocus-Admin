"use client";

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
import { updateProjectApi } from "@/services/project.services";
import type { Project } from "./project-card"; // Import kiểu Project từ card

const formSchema = z.object({
  name: z.string().min(5, "Tên dự án phải có ít nhất 5 ký tự."),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
});

type UpdateProjectFormValues = z.infer<typeof formSchema>;

interface UpdateProjectDialogProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function UpdateProjectDialog({ project, isOpen, onOpenChange, onActionComplete }: UpdateProjectDialogProps) {
  const form = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(formSchema),
    // Lấy giá trị mặc định từ project đang có
    defaultValues: {
      name: project.name,
      description: project.description,
    },
  });

  const onSubmit = async (data: UpdateProjectFormValues) => {
    try {
      await updateProjectApi(project._id, data);
      toast.success("Cập nhật dự án thành công!");
      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật dự án.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dự án</DialogTitle>
          <DialogDescription>Cập nhật lại tên và mô tả cho dự án.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Tên dự án</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Mô tả chi tiết</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter className="pt-4">
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