"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input"; // <-- Import Input
import { Search } from "lucide-react"; // <-- Import icon Search
import { searchProjectsApi } from "@/services/project.services";
import { cn } from "@/lib/utils";

// Custom hook để debounce, tránh gọi API liên tục khi gõ phím
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Định nghĩa kiểu Project rút gọn
interface Project {
  _id: string;
  name: string;
}

interface ProjectListProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

export function ProjectList({ selectedProjectId, onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // --- STATE CHO TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- CẬP NHẬT HÀM GỌI API ĐỂ CÓ TÌM KIẾM ---
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        searchCondition: { 
          keyword: debouncedSearchTerm.trim(), // Dùng từ khóa đã debounce
          is_deleted: false 
        },
        pageInfo: { pageNum: 1, pageSize: 100 },
      };
      const response = await searchProjectsApi(payload);
      setProjects(response.data.records);
    } catch (error) {
      console.error("Lỗi khi tải danh sách dự án:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]); // Phụ thuộc vào từ khóa tìm kiếm

  // useEffect giờ sẽ chạy lại khi từ khóa thay đổi
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col h-full">
      {/* --- THANH TÌM KIẾM MỚI --- */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm dự án..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-4">
            {projects.length > 0 ? projects.map(project => (
              <Button
                key={project._id}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  selectedProjectId === project._id && "bg-muted text-primary hover:bg-muted hover:text-primary"
                )}
                onClick={() => onProjectSelect(project._id)}
              >
                {project.name}
              </Button>
            )) : (
              <p className="text-sm text-center text-muted-foreground py-4">Không tìm thấy dự án.</p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}