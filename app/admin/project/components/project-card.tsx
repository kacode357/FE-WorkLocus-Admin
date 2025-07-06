"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Users, User, Clock, Shield, Globe, MoreVertical, Trash2, CheckCircle2, ListChecks, UserPlus, Pencil } from "lucide-react";
import { toast } from 'sonner';
import { completeProjectApi, deleteProjectApi } from '@/services/project.services';
import { AddMemberDialog } from './add-member-dialog';
import { UpdateProjectDialog } from './update-project-dialog';
import { ViewMembersSheet } from './view-members-sheet';

// Cập nhật Type Project cho khớp với response mới nhất của mày
export type Project = {
  _id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  manager: { 
    _id: string; 
    full_name: string; 
    email: string; 
    image_url: string | null 
  };
  members: { 
    _id: string; 
    full_name: string; 
    email: string; 
    image_url: string | null 
  }[];
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  is_deleted: boolean;
  task_count: number;
  created_at: string;
};

interface ProjectCardProps {
    project: Project;
    onActionComplete: () => void;
}

const statusConfig = {
    planning: { text: "Đang lên kế hoạch", color: "bg-blue-500" },
    "in-progress": { text: "Đang thực hiện", color: "bg-yellow-500" },
    completed: { text: "Đã hoàn thành", color: "bg-green-500" },
    "on-hold": { text: "Tạm hoãn", color: "bg-gray-500" },
};

export function ProjectCard({ project, onActionComplete }: ProjectCardProps) {
  const [dialogs, setDialogs] = useState({
      delete: false,
      complete: false,
      update: false,
      members: false
  });

  const openDialog = (type: keyof typeof dialogs) => setDialogs(p => ({ ...p, [type]: true }));
  const closeDialog = (type: keyof typeof dialogs) => setDialogs(p => ({ ...p, [type]: false }));
  
  const manager = project.manager;

  const getInitials = (name?: string) => {
    if (!name) return "PM";
    const names = name.split(' ');
    return ((names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")).toUpperCase();
  };
  
  const handleDelete = async () => {
    try {
        await deleteProjectApi(project._id);
        toast.success("Xóa dự án thành công.");
        onActionComplete();
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi xóa dự án.");
    }
  };

  const handleComplete = async () => {
     try {
        await completeProjectApi(project._id);
        toast.success("Đã đánh dấu dự án là hoàn thành.");
        onActionComplete();
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái.");
    }
  };

  return (
    <>
      <Card className="flex flex-col relative transition-all hover:shadow-md">
        {project.is_deleted && (
            <div className="absolute top-3 right-3 z-10">
                <Badge variant="destructive">Đã xóa</Badge>
            </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-lg pr-12">{project.name}</CardTitle>
            <div className="flex-shrink-0 flex items-center gap-2">
              <Badge variant={project.type === 'public' ? 'outline' : 'secondary'} className="h-fit">
                {project.type === 'public' ? <Globe className="mr-1.5 h-3 w-3"/> : <Shield className="mr-1.5 h-3 w-3"/>}
                {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
              </Badge>
              {!project.is_deleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDialog('update')}><Pencil className="mr-2 h-4 w-4"/>Sửa thông tin</DropdownMenuItem>
                    {project.status !== 'completed' && <DropdownMenuItem onClick={() => openDialog('complete')}><CheckCircle2 className="mr-2 h-4 w-4"/>Đánh dấu Hoàn thành</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openDialog('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Xóa dự án</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <CardDescription className="line-clamp-2 pt-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          {manager && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 flex-shrink-0"/>
                <span className="font-semibold mr-1">Quản lý:</span>
                <Avatar className="h-6 w-6"><AvatarImage src={manager.image_url ?? undefined} /><AvatarFallback>{getInitials(manager.full_name)}</AvatarFallback></Avatar>
                <span>{manager.full_name}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            {/* Đã chỉnh sửa chỗ này */}
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary transition-colors" onClick={() => openDialog('members')}>
              <Users className="h-4 w-4 mr-2"/>
              <span className="font-semibold">{project.members.length} thành viên</span> {/* Gộp số và chữ "thành viên" vào cùng một span */}
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground"><ListChecks className="h-4 w-4" /><span className="font-semibold">{project.task_count}</span><span>công việc</span></div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3"/><span>Tạo ngày: {new Date(project.created_at).toLocaleDateString("vi-VN")}</span></div>
            {!project.is_deleted && (<AddMemberDialog projectId={project._id} onMemberAdded={onActionComplete} />)}
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusConfig[project.status as keyof typeof statusConfig]?.color}`}></span>
                <span className="font-medium text-xs">{statusConfig[project.status as keyof typeof statusConfig]?.text}</span>
            </div>
        </CardFooter>
      </Card>

      {/* KHAI BÁO CÁC DIALOG VÀ SHEET */}
      <UpdateProjectDialog project={project} isOpen={dialogs.update} onOpenChange={(open) => setDialogs(p => ({...p, update: open}))} onActionComplete={onActionComplete} />
      <ViewMembersSheet project={project} isOpen={dialogs.members} onOpenChange={(open) => setDialogs(p => ({...p, members: open}))} onActionComplete={onActionComplete} />
      
      {/* Dialog xác nhận xóa */}
      <AlertDialog open={dialogs.delete} onOpenChange={(open) => setDialogs(p => ({...p, delete: open}))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xóa dự án?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Dự án sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận hoàn thành */}
      <AlertDialog open={dialogs.complete} onOpenChange={(open) => setDialogs(p => ({...p, complete: open}))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Đánh dấu dự án là hoàn thành?</AlertDialogTitle><AlertDialogDescription>Trạng thái của dự án sẽ được cập nhật thành "Đã hoàn thành".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleComplete}>Xác nhận</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}