"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, CheckCircle2, Pencil, GitFork } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import TaskService from "@/services/task.services";
import { UpdateTaskDialog } from "./update-task-dialog"; // Import UpdateTaskDialog

// Định nghĩa kiểu Task đầy đủ (giữ nguyên từ code mày)
export interface Task {
  _id: string;
  name: string;
  description: string;
  project_id: { _id: string; name: string };
  parent_id: string | null;
  assignee_id: { _id: string; full_name: string; email: string; image_url: string | null; };
  reporter_id: { _id: string; full_name: string; };
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  is_deleted: boolean;
  children?: Task[];
}

interface TaskItemProps {
  task: Task;
  projectMembers: any[]; // Giữ nguyên projectMembers ở đây nếu nó vẫn được dùng cho mục đích khác trong TaskItem
  level: number;
  onActionComplete: () => void;
}

export function TaskItem({ task, projectMembers, level, onActionComplete }: TaskItemProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [subtaskName, setSubtaskName] = useState("");

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "NA";
  
  const handleDelete = async () => {
    try {
      await TaskService.deleteTask(task._id);
      toast.success("Xóa công việc thành công.");
      onActionComplete();
    } catch (error) {
      console.error("Lỗi khi xóa công việc:", error);
     
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const handleComplete = async () => {
    try {
      await TaskService.completeTask(task._id);
      toast.success("Hoàn thành công việc thành công.");
      onActionComplete();
    } catch (error) {
      console.error("Lỗi khi hoàn thành công việc:", error);
    }
  };

  const handleCreateSubtask = async () => {
    if (!subtaskName.trim()) {
      toast.warning("Vui lòng nhập tên công việc con.");
      return;
    }
    try {
      await TaskService.createTask({
        name: subtaskName,
        description: "",
        project_id: task.project_id._id,
        parent_id: task._id,
      });
      toast.success("Tạo công việc con thành công.");
      onActionComplete();
      setIsCreatingSubtask(false);
      setSubtaskName("");
    } catch (error) {
      console.error("Lỗi khi tạo công việc con:", error);

    }
  }

  return (
    <div>
      <div 
        className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={task.assignee_id?.image_url ?? undefined} />
            <AvatarFallback>{getInitials(task.assignee_id?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{task.name}</p>
            <p className="text-xs text-muted-foreground">{task.assignee_id?.full_name || "Chưa gán"}</p>
          </div>
        </div>
       <div className="flex items-center gap-2 ml-4">
          {/* Badge luôn hiển thị */}
          <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>{task.status.replace('_', ' ')}</Badge>
          
          {/* Menu chỉ hiện khi hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsCreatingSubtask(true)}><GitFork className="mr-2 h-4 w-4"/>Thêm công việc con</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUpdateOpen(true)}><Pencil className="mr-2 h-4 w-4"/>Sửa</DropdownMenuItem>
                {task.status !== 'done' && <DropdownMenuItem onClick={handleComplete}><CheckCircle2 className="mr-2 h-4 w-4"/>Hoàn thành</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Xóa</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {isCreatingSubtask && (
        <div 
          className="flex items-center gap-2 py-2"
          style={{ marginLeft: `${(level + 1) * 24}px` }}
        >
          <Input 
            autoFocus
            placeholder="Nhập tên công việc con rồi nhấn Enter..."
            value={subtaskName}
            onChange={(e) => setSubtaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubtask();
              if (e.key === 'Escape') setIsCreatingSubtask(false);
            }}
          />
          <Button size="sm" onClick={handleCreateSubtask}>Lưu</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsCreatingSubtask(false)}>Hủy</Button>
        </div>
      )}

      {/* ĐÃ SỬA LỖI Ở DÒNG NÀY: Bỏ projectMembers prop */}
      <UpdateTaskDialog 
        isOpen={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        task={task}
        onActionComplete={onActionComplete}
      />
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Công việc sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}