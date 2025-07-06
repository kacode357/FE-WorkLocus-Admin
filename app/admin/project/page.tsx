"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react"; // <-- Import icon loading
import { searchProjectsApi } from "@/services/project.services";
import { CreateProjectDialog } from "./components/create-project-dialog";
import { ProjectCard, Project } from "./components/project-card";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Chỉ dùng cho lần tải đầu tiên
  const [isRefetching, setIsRefetching] = useState(false); // <-- State cho loading mượt

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedKeyword = useDebounce(keyword, 500);

  // --- SỬA LẠI HÀM FETCH ---
  const fetchProjects = useCallback(async (page: number) => {
    // Phân biệt loading lần đầu và loading lại
    if (projects.length === 0) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }

    try {
      const isDeletedValue = status === 'all' ? null : status === 'deleted';
      const payload = {
        searchCondition: { keyword: debouncedKeyword.trim(), is_deleted: isDeletedValue },
        pageInfo: { pageNum: page, pageSize: 5 },
      };
      
      const response = await searchProjectsApi(payload);
      setProjects(response.data.records);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách dự án:", error);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [debouncedKeyword, status, projects.length]); // Thêm projects.length vào dependency

  // --- TÁCH USE EFFECT CHO RÕ RÀNG ---

  // Effect này chỉ để reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, status]);

  // Effect này để gọi API khi trang hoặc filter thay đổi (sau khi đã reset trang)
  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage, fetchProjects]);

  const handleActionComplete = () => {
    fetchProjects(currentPage);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Dự án</h1>
            <p className="text-muted-foreground">Xem, tìm kiếm và tạo mới các dự án của bạn.</p>
          </div>
          {/* --- ICON LOADING MƯỢT MÀ --- */}
          {isRefetching && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
        <CreateProjectDialog onProjectCreated={handleActionComplete} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Tìm tên dự án..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-grow"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="deleted">Đã xóa</SelectItem>
            <SelectItem value="all">Tất cả dự án</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard 
                key={project._id} 
                project={project} 
                onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed shadow-sm h-64">
          <h3 className="text-xl font-semibold">Không tìm thấy dự án nào</h3>
          <p className="text-muted-foreground">Hãy thử thay đổi bộ lọc hoặc tạo một dự án mới.</p>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); currentPage > 1 && setCurrentPage(currentPage - 1);}} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <PaginationItem key={i}><PaginationLink href="#" isActive={currentPage === i+1} onClick={(e) => {e.preventDefault(); setCurrentPage(i+1)}}>{i+1}</PaginationLink></PaginationItem>
              ))}
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); currentPage < pagination.totalPages && setCurrentPage(currentPage + 1);}} className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}