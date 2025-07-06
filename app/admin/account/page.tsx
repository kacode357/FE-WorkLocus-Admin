"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { searchAdminUsersApi } from "@/services/admin.services";
import { CreateUserDialog } from "./components/create-user-dialog";
import { UserTableActions } from "./components/user-table-actions";
import { UserFilters } from "./components/user-filters";

type Role = "admin" | "employee" | "tl" | "pm";
interface User {
  _id: string; full_name: string; email: string; role: Role;
  image_url: string | null; is_activated: boolean; created_at: string;
}
interface PaginationInfo {
  currentPage: number; totalPages: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminAccountPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword: "", role: "all", status: "all" });
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedKeyword = useDebounce(filters.keyword, 500);

  const fetchUsers = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const payload = {
        searchCondition: {
          keyword: debouncedKeyword.trim(),
          is_activated: filters.status === "all" ? null : filters.status === "active",
          role: filters.role === "all" ? "" : filters.role,
        },
        pageInfo: { pageNum: page, pageSize: 5 },
      };
      const response = await searchAdminUsersApi(payload);
      setUsers(response.data.records);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      setUsers([]); setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedKeyword, filters.role, filters.status]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    else fetchUsers(1);
  }, [debouncedKeyword, filters.role, filters.status, fetchUsers]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const names = name.split(' ');
    return ((names[0]?.[0] || "") + (names.length > 1 ? names[names.length - 1]?.[0] || "" : "")).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Quản lý người dùng</CardTitle>
            <CardDescription>Thêm mới, tìm kiếm, và quản lý người dùng.</CardDescription>
          </div>
          <CreateUserDialog onUserCreated={() => fetchUsers(1)} />
        </div>
      </CardHeader>
      <CardContent>
        <UserFilters
          keyword={filters.keyword} onKeywordChange={(v) => setFilters(p => ({ ...p, keyword: v }))}
          role={filters.role} onRoleChange={(v) => setFilters(p => ({ ...p, role: v }))}
          status={filters.status} onStatusChange={(v) => setFilters(p => ({ ...p, status: v }))}
        />
        <div className="mt-6 rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Người dùng</TableHead><TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead><TableHead>Ngày tham gia</TableHead>
              <TableHead><span className="sr-only">Hành động</span></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
              )) : users.length > 0 ? users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarImage src={user.image_url ?? undefined} /><AvatarFallback>{getInitials(user.full_name)}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-semibold">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{user.role.toUpperCase()}</Badge></TableCell>
                  <TableCell><Badge variant={user.is_activated ? 'default' : 'secondary'}>{user.is_activated ? "Hoạt động" : "Bị khóa"}</Badge></TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell><UserTableActions user={user} onActionComplete={() => fetchUsers(currentPage)} /></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Không có dữ liệu.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        {pagination && pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); currentPage > 1 && setCurrentPage(currentPage - 1); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>
              ))}
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); currentPage < pagination.totalPages && setCurrentPage(currentPage + 1); }} className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
}