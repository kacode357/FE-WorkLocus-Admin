"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchAdminUsersApi } from "@/services/admin.services";

// Định nghĩa kiểu User
export interface User {
  _id: string;
  full_name: string;
  email: string;
  base_salary_per_day: number;
}

interface EmployeeSelectorProps {
  onUserSelect: (user: User | null) => void;
}

export function EmployeeSelector({ onUserSelect }: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await searchAdminUsersApi({
        searchCondition: { keyword: searchQuery, is_activated: true, role: "" },
        pageInfo: { pageNum: 1, pageSize: 20 },
      });
      setUsers(response.data.records);
    };
    const handler = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    onUserSelect(user);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedUser ? selectedUser.full_name : "Chọn nhân viên..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Tìm nhân viên..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandEmpty>Không tìm thấy nhân viên.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem key={user._id} value={user.full_name} onSelect={() => handleSelect(user)}>
                  <Check className={cn("mr-2 h-4 w-4", selectedUser?._id === user._id ? "opacity-100" : "opacity-0")} />
                  {user.full_name} ({user.email})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}