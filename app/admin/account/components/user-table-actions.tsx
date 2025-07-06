"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldOff, ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as adminServices from "@/services/admin.services";

interface User {
  _id: string;
  is_activated: boolean;
}
interface UserTableActionsProps {
  user: User;
  onActionComplete: () => void;
}

export function UserTableActions({ user, onActionComplete }: UserTableActionsProps) {
  const [dialogState, setDialogState] = useState({
    block: false,
    password: false,
    delete: false,
  });
  const [reason, setReason] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const openDialog = (type: 'block' | 'password' | 'delete') => setDialogState(prev => ({ ...prev, [type]: true }));
  const closeDialog = (type: 'block' | 'password' | 'delete') => setDialogState(prev => ({ ...prev, [type]: false }));

  const handleAction = async (action: () => Promise<any>, successMsg: string, errorMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMsg);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog('password')}><KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu</DropdownMenuItem>
          {user.is_activated
            ? <DropdownMenuItem onClick={() => openDialog('block')}><ShieldOff className="mr-2 h-4 w-4" /> Khóa tài khoản</DropdownMenuItem>
            : <DropdownMenuItem onClick={() => handleAction(() => adminServices.unblockAdminUserApi(user._id), "Mở khóa thành công.", "Lỗi khi mở khóa")}><ShieldCheck className="mr-2 h-4 w-4" /> Mở khóa</DropdownMenuItem>
          }
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Xóa vĩnh viễn</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- CÁC DIALOG XÁC NHẬN --- */}
      
      {/* Dialog khóa */}
      <AlertDialog open={dialogState.block} onOpenChange={(open) => !open && closeDialog('block')}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận khóa người dùng?</AlertDialogTitle></AlertDialogHeader>
          <Label htmlFor="reason">Lý do khóa (không bắt buộc)</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(() => adminServices.blockAdminUserApi(user._id, { reason }), "Khóa thành công.", "Lỗi khi khóa")}>Khóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog đổi mật khẩu */}
      <AlertDialog open={dialogState.password} onOpenChange={(open) => !open && closeDialog('password')}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Đổi mật khẩu</AlertDialogTitle></AlertDialogHeader>
          <Label htmlFor="new-password">Mật khẩu mới (ít nhất 6 ký tự)</Label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(() => adminServices.changeAdminUserPasswordApi(user._id, { newPassword }), "Đổi mật khẩu thành công.", "Lỗi khi đổi mật khẩu")}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xóa */}
      <AlertDialog open={dialogState.delete} onOpenChange={(open) => !open && closeDialog('delete')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Tài khoản sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(() => adminServices.deleteAdminUserApi(user._id), "Xóa thành công.", "Lỗi khi xóa")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}