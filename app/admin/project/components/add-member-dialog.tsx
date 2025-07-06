"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchAdminUsersApi } from "@/services/admin.services";
import { addMemberToProjectApi } from "@/services/project.services";

// Định nghĩa kiểu User rút gọn
interface User {
  _id: string;
  full_name: string;
  email: string;
  image_url: string | null;
}

// Custom hook Debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

interface AddMemberDialogProps {
  projectId: string;
  onMemberAdded: () => void;
}

export function AddMemberDialog({ projectId, onMemberAdded }: AddMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    // Không cần check debouncedSearchTerm nữa, để luôn tải danh sách ban đầu
    setIsLoading(true);
    try {
      const payload = {
        searchCondition: { keyword: debouncedSearchTerm, is_activated: true, role: "" },
        pageInfo: { pageNum: 1, pageSize: 10 },
      };
      const response = await searchAdminUsersApi(payload);
      setUsers(response.data.records);
    } catch (error) {
      console.error("Lỗi khi tìm user:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]);

  // useEffect này sẽ chạy khi dialog mở ra và khi người dùng tìm kiếm
  useEffect(() => {
    if (isOpen) {
        fetchUsers();
    }
  }, [isOpen, fetchUsers]);
  
  const handleAddMember = async (userId: string) => {
    setAddingId(userId);
    try {
        await addMemberToProjectApi(projectId, userId);
        toast.success("Thêm thành viên thành công!");
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        onMemberAdded();
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi thêm thành viên.");
    } finally {
        setAddingId(null);
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(' ');
    return ((names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* SỬA LẠI ĐÂY: Đổi variant để nút nổi bật hơn */}
        <Button variant="secondary" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm thành viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm thành viên vào dự án</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm user theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-4">
            {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>}
            {!isLoading && users.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Không tìm thấy user nào.</p>}
            {!isLoading && users.map(user => (
              <div key={user._id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.image_url ?? undefined} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAddMember(user._id)} disabled={addingId === user._id}>
                  {addingId === user._id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Thêm"}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}