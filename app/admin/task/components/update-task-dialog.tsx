// app\admin\task\components\update-task-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TaskService from "@/services/task.services";
import type { Task } from "./task-item";

const formSchema = z.object({
  name: z.string().min(3, "Tên công việc quá ngắn."),
  assignee_id: z.string().nullable().optional(), 
});

type UpdateTaskFormValues = z.infer<typeof formSchema>;

interface UserProfile {
  _id: string;
  full_name: string;
  email: string;
  image_url?: string | null; // Có thể có thêm trường này từ API members
}

interface UpdateTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onActionComplete: () => void;
}

const UNASSIGNED_VALUE = "unassigned-task"; 

export function UpdateTaskDialog({ isOpen, onOpenChange, task, onActionComplete }: UpdateTaskDialogProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(formSchema),
    values: {
      name: task.name,
      assignee_id: task.assignee_id?._id || null, 
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: task.name,
        assignee_id: task.assignee_id?._id || null, 
      });
      fetchUsers();
    }
  }, [isOpen, task, form.reset]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Gọi API searchProjectMembersApi VỚI PROJECT ID CỦA TASK
      const response = await TaskService.searchProjectMembers(task.project_id._id, {
        searchCondition: {
          keyword: "",
          is_activated: true,
          role: "", // Có thể giới hạn role nếu cần, ví dụ: "employee", "team_leader"
        },
        pageInfo: {
          pageNum: 1,
          pageSize: 100,
        },
      });
      
      if (response && Array.isArray(response.data?.records)) { // Kiểm tra response.data.records
        setUsers(response.data.records); 
      } else {
        console.warn("API did not return an array in response.data.records:", response);
        setUsers([]); 
      }
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng dự án.");
      console.error("Lỗi khi tải người dùng dự án:", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const onSubmit = async (data: UpdateTaskFormValues) => {
    try {
      await TaskService.updateTask(task._id, {
        name: data.name,
        assignee_id: data.assignee_id,
      });
      toast.success("Cập nhật công việc thành công.");
      onActionComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Lỗi khi cập nhật.");
      console.error("Lỗi cập nhật task:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Sửa công việc</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Tên công việc</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="assignee_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Gán cho</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === UNASSIGNED_VALUE ? null : value)} 
                  value={field.value === null ? UNASSIGNED_VALUE : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người thực hiện" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>Không gán</SelectItem>
                    {isLoadingUsers ? (
                      <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                    ) : (
                      users.map(member => (
                        <SelectItem key={member._id} value={member._id}>{member.full_name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter><Button type="submit">Lưu thay đổi</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}