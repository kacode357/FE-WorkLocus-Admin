"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldOff, ShieldCheck, KeyRound, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as adminServices from "@/services/admin.services";
import { UpdateRoleDialog } from "./update-role-dialog";

// Cập nhật lại User type cho đầy đủ
interface User {
  _id: string;
  full_name: string;
  role: string;
  is_activated: boolean;
  base_salary_per_day?: number;
}
interface UserTableActionsProps {
  user: User;
  onActionComplete: () => void;
}

export function UserTableActions({ user, onActionComplete }: UserTableActionsProps) {
  const [dialogs, setDialogs] = useState({
    block: false,
    password: false,
    delete: false,
    role: false,
  });
  const [reason, setReason] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const openDialog = (type: keyof typeof dialogs) => setDialogs(p => ({ ...p, [type]: true }));
  const closeDialog = (type: keyof typeof dialogs) => setDialogs(p => ({ ...p, [type]: false }));

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog('role')}><UserCog className="mr-2 h-4 w-4"/> Đổi vai trò</DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDialog('password')}><KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu</DropdownMenuItem>
          {user.is_activated
            ? <DropdownMenuItem onClick={() => openDialog('block')}><ShieldOff className="mr-2 h-4 w-4" /> Khóa tài khoản</DropdownMenuItem>
            : <DropdownMenuItem onClick={() => handleAction(() => adminServices.unblockAdminUserApi(user._id), "Mở khóa thành công.")}><ShieldCheck className="mr-2 h-4 w-4" /> Mở khóa</DropdownMenuItem>
          }
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Xóa vĩnh viễn</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* RENDER CÁC DIALOG */}
      <UpdateRoleDialog
        user={user}
        isOpen={dialogs.role}
        onOpenChange={(open: boolean) => !open && closeDialog('role')}
        onActionComplete={onActionComplete}
      />
      
      {/* SỬA LẠI CÁC DÒNG onOpenChange BÊN DƯỚI */}
      <AlertDialog open={dialogs.block} onOpenChange={(open: boolean) => !open && closeDialog('block')}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận khóa người dùng?</AlertDialogTitle></AlertDialogHeader>
          <Label htmlFor="reason">Lý do khóa (không bắt buộc)</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(() => adminServices.blockAdminUserApi(user._id, { reason }), "Khóa thành công.")}>Khóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogs.password} onOpenChange={(open: boolean) => !open && closeDialog('password')}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Đổi mật khẩu</AlertDialogTitle></AlertDialogHeader>
          <Label htmlFor="new-password">Mật khẩu mới (ít nhất 6 ký tự)</Label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (newPassword.length < 6) {
                    toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
                    return;
                }
                handleAction(() => adminServices.changeAdminUserPasswordApi(user._id, { newPassword }), "Đổi mật khẩu thành công.");
            }}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogs.delete} onOpenChange={(open: boolean) => !open && closeDialog('delete')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Tài khoản sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(() => adminServices.deleteAdminUserApi(user._id), "Xóa thành công.")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}