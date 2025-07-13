// app\admin\task\components\task-board.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import TaskService from '@/services/task.services';
import { searchProjectsApi } from '@/services/project.services';
import { TaskItem, Task } from './task-item';
import { cn } from '@/lib/utils';

// Hàm xây dựng cây công việc (giữ nguyên)
function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map(task => [task._id, { ...task, children: [] as Task[] }]));
  const tree: Task[] = [];
  
  taskMap.forEach(task => {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      taskMap.get(task.parent_id)!.children.push(task);
    } else {
      tree.push(task);
    }
  });
  tree.sort((a, b) => a.name.localeCompare(b.name));
  tree.forEach(task => {
    if (task.children) {
      task.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  });
  return tree;
}

// Component render đệ quy (giữ nguyên)
function RenderTaskNode({ task, level, ...props }: { task: Task, level: number, projectMembers: any[], onActionComplete: () => void }) {
  return (
    <div>
      <TaskItem task={task} level={level} {...props} />
      {task.children && task.children.length > 0 && (
        <div>
          {task.children.map(child => <RenderTaskNode key={child._id} task={child} level={level + 1} {...props} />)}
        </div>
      )}
    </div>
  );
}

interface TaskBoardProps {
  projectId: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); 
  const [isRefetching, setIsRefetching] = useState(false); 
  const [newTaskName, setNewTaskName] = useState("");
  const [isInputError, setIsInputError] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [actualSearchTerm, setActualSearchTerm] = useState("");

  const fetchTasksAndProject = useCallback(async () => {
    // Luôn đặt isInitialLoading = true khi bắt đầu fetch (để hiển thị skeleton)
    setIsInitialLoading(true); 
    // Chỉ bật isRefetching nếu đã có dữ liệu project được tải (không phải lần đầu tiên)
    // Dùng project id để kiểm tra thay vì object project trực tiếp để tránh vấn đề reference
    if (project?._id === projectId) { 
        setIsRefetching(true);
    }

    try {
      const [taskResponse, projectResponse] = await Promise.all([
        TaskService.searchAdminTasks({
          searchCondition: { 
            project_id: projectId, 
            is_deleted: false,
            keyword: actualSearchTerm.trim(),
          },
          pageInfo: { pageNum: 1, pageSize: 200 } 
        }),
        searchProjectsApi({
            searchCondition: { keyword: "", is_deleted: null },
            pageInfo: { pageNum: 1, pageSize: 999 } 
        })
      ]);
      
      setTasks(taskResponse.data.records);
      const currentProject = projectResponse.data.records.find((p:any) => p._id === projectId);
      setProject(currentProject);

    } catch (error) {
      console.error("Lỗi khi tải công việc:", error);
      toast.error("Lỗi khi tải công việc. Vui lòng thử lại.");
    } finally {
      setIsInitialLoading(false); 
      setIsRefetching(false); 
    }
  }, [projectId, actualSearchTerm]); // ĐÃ SỬA LỖI: BỎ 'project' ra khỏi dependency array
  // Giữ lại 'project' ở đây chỉ khi logic của hàm THỰC SỰ cần giá trị 'project' TRƯỚC KHI nó được cập nhật bên trong hàm.
  // Trong trường hợp này, việc kiểm tra `if (project?._id === projectId)` là đủ và an toàn hơn.


  useEffect(() => {
    if (projectId) {
      // Khi projectId thay đổi, reset tất cả trạng thái liên quan đến dữ liệu và tìm kiếm
      setTasks([]);
      setProject(null); // Đặt project về null để kích hoạt isInitialLoading cho dự án mới
      setSearchInput(""); 
      setActualSearchTerm(""); // Đảm bảo từ khóa tìm kiếm reset khi đổi dự án
      
      // Gọi fetchTasksAndProject ngay lập tức sau khi reset trạng thái
      fetchTasksAndProject();
    }
  }, [projectId, fetchTasksAndProject]); 
  
  const handleCreateTask = async () => {
    if(!newTaskName.trim()) {
      setIsInputError(true);
      setTimeout(() => setIsInputError(false), 500); 
      toast.warning("Tên công việc không được để trống.");
      return;
    }
    try {
      await TaskService.createTask({ name: newTaskName, description: "", project_id: projectId });
      toast.success("Tạo công việc mới thành công.");
      setNewTaskName("");
      fetchTasksAndProject(); 
    } catch (error) {
      toast.error("Lỗi khi tạo công việc.");
      console.error("Lỗi khi tạo công việc:", error);
    }
  }

  const handleSearch = () => {
    setActualSearchTerm(searchInput); 
  };

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);
  
  if (!projectId) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Chọn một dự án để xem công việc.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Công việc của dự án: {project?.name}</h2>
        {isRefetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Nhập tên công việc để tìm kiếm..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Tìm</Button>
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Nhập tên công việc mới..." 
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
          className={cn(isInputError && "border-destructive ring-2 ring-destructive/50 transition-all duration-300")}
        />
        <Button onClick={handleCreateTask}><PlusCircle className="h-4 w-4 mr-2"/> Tạo</Button>
      </div>

      <div className="border rounded-lg min-h-[200px] p-2">
        {isInitialLoading ? (
          <div className="space-y-2">
            {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          taskTree.length > 0 ? taskTree.map(task => (
              <RenderTaskNode 
                  key={task._id} 
                  task={task} 
                  level={0} 
                  projectMembers={project?.members || []}
                  onActionComplete={fetchTasksAndProject}
              />
          )) : (
              <p className="text-center text-sm text-muted-foreground p-8">
                {actualSearchTerm.trim() ? "Không tìm thấy công việc nào khớp với từ khóa của bạn." : "Dự án này chưa có công việc nào."}
              </p>
          )
        )}
      </div>
    </div>
  );
}