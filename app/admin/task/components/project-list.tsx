"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchProjectsApi } from "@/services/project.services";
import { cn } from "@/lib/utils";

// Hook debounce cho search
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

interface Project {
  _id: string;
  name: string;
}

interface ProjectListProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

const LOCAL_KEY = "lastSelectedProjectId"; // Key cho localStorage

export function ProjectList({ selectedProjectId, onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [initSelected, setInitSelected] = useState(false); // Đảm bảo chỉ init 1 lần khi vào

  // --- INIT: Khi lần đầu vào, tự động lấy id cũ từ localStorage ---
  useEffect(() => {
    if (!initSelected) {
      const lastId = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null;
      if (lastId) {
        onProjectSelect(lastId);
      }
      setInitSelected(true);
    }
  }, [initSelected, onProjectSelect]);

  // --- Gọi API lấy projects ---
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        searchCondition: { 
          keyword: debouncedSearchTerm.trim(),
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
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sau khi fetch xong, nếu chưa chọn gì thì tự động chọn
  useEffect(() => {
    if (!isLoading && projects.length > 0 && !selectedProjectId) {
      onProjectSelect(projects[0]._id);
    }
  }, [isLoading, projects, selectedProjectId, onProjectSelect]);

  // --- Lưu vào localStorage khi chọn project ---
  const handleSelectProject = (projectId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY, projectId);
    }
    onProjectSelect(projectId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thanh tìm kiếm */}
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
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-4">
            {projects.length > 0 ? (
              projects.map(project => (
                <Button
                  key={project._id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    selectedProjectId === project._id && "bg-muted text-primary hover:bg-muted hover:text-primary"
                  )}
                  onClick={() => handleSelectProject(project._id)}
                >
                  {project.name}
                </Button>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                Không tìm thấy dự án.
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
