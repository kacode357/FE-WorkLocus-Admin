"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { removeMemberFromProjectApi } from "@/services/project.services";
import type { Project } from "./project-card";

interface ViewMembersSheetProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function ViewMembersSheet({ project, isOpen, onOpenChange, onActionComplete }: ViewMembersSheetProps) {
  const [memberToRemove, setMemberToRemove] = useState<Project['members'][0] | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(' ');
    return ((names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")).toUpperCase();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
        await removeMemberFromProjectApi(project._id, memberToRemove._id);
        toast.success(`Đã xóa ${memberToRemove.full_name} khỏi dự án.`);
        onActionComplete();
        // Cập nhật ngay trên UI mà không cần chờ reload
        // (Hoặc có thể chỉ dựa vào onActionComplete để reload)
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi xóa thành viên.");
    } finally {
        setMemberToRemove(null);
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Thành viên dự án</SheetTitle>
            <SheetDescription>"{project.name}"</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-4 pr-6 p-5">
                {project.members.length > 0 ? project.members.map(member => (
                    <div key={member._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.image_url ?? undefined}/>
                                <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.full_name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setMemberToRemove(member)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                )) : (
                    <p className="text-center text-muted-foreground pt-10">Dự án chưa có thành viên nào.</p>
                )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog xác nhận xóa thành viên */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Xóa thành viên?</AlertDialogTitle>
            </AlertDialogHeader>
            <p>Bạn có chắc muốn xóa <strong>{memberToRemove?.full_name}</strong> khỏi dự án này?</p>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}