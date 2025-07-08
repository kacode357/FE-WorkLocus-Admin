"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
}

export function UserFilters({
  keyword,
  onKeywordChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <Input
        placeholder="Tìm theo tên hoặc email..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="flex-grow"
      />
      <div className="flex w-full md:w-auto gap-4">
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="team_leader">Team Leader</SelectItem>
            <SelectItem value="project_manager">Project Manager</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}