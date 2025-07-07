"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRoleApi } from "@/services/admin.services"; // Đổi lại tên service cho đúng

// Type cho User, chỉ cần các trường cần thiết
interface User {
  _id: string;
  full_name: string;
  role: string;
}

const formSchema = z.object({
  role: z.enum(["employee", "team_leader", "project_manager"], {
    required_error: "Vui lòng chọn vai trò mới.",
  }),
});

type UpdateRoleFormValues = z.infer<typeof formSchema>;

interface UpdateRoleDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function UpdateRoleDialog({ user, isOpen, onOpenChange, onActionComplete }: UpdateRoleDialogProps) {
  const form = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role as "employee" | "team_leader" | "project_manager" | undefined,
    },
  });

  const onSubmit = async (data: UpdateRoleFormValues) => {
    try {
      await updateUserRoleApi(user._id, { role: data.role });
      toast.success(`Cập nhật vai trò cho ${user.full_name} thành công!`);
      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật vai trò.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi vai trò</DialogTitle>
          <DialogDescription>
            Chọn một vai trò mới cho người dùng <strong>{user.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò mới</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="team_leader">Team Leader</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                    </SelectContent>
                  </Select>
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