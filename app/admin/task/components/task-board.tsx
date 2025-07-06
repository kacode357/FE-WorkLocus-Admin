"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import TaskService from '@/services/task.services';
import { searchProjectsApi } from '@/services/project.services';
import { TaskItem, Task } from './task-item';
import { cn } from '@/lib/utils';

// Hàm xây dựng cây công việc
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
  return tree;
}

// Component render đệ quy
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [isInputError, setIsInputError] = useState(false);

  const fetchTasksAndProject = useCallback(async () => {
    // Chỉ set loading to khi tải lần đầu
    if (!project) setIsLoading(true); 
    else setIsRefetching(true); // Các lần sau chỉ hiện icon xoay

    try {
      // Dùng Promise.all để tải song song, nhanh hơn
      const [taskResponse, projectResponse] = await Promise.all([
        TaskService.searchAdminTasks({
          searchCondition: { project_id: projectId, is_deleted: false },
          pageInfo: { pageNum: 1, pageSize: 200 } // Tải nhiều task để đủ cho 1 dự án
        }),
        // Tải lại thông tin dự án để cập nhật member list
        searchProjectsApi({
            searchCondition: { keyword: "", is_deleted: null },
            pageInfo: { pageNum: 1, pageSize: 999 } // Giả sử lấy hết project
        })
      ]);
      
      setTasks(taskResponse.data.records);
      const currentProject = projectResponse.data.records.find((p:any) => p._id === projectId);
      setProject(currentProject);

    } catch (error) {
      console.error("Lỗi khi tải công việc:", error);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [projectId, project]);

  useEffect(() => {
    if (projectId) {
      // Reset trạng thái khi đổi dự án
      setProject(null);
      setTasks([]);
      fetchTasksAndProject();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); 
  
  const handleCreateTask = async () => {
    if(!newTaskName.trim()) {
        setIsInputError(true);
        setTimeout(() => setIsInputError(false), 500); // Tắt hiệu ứng sau 0.5s
        return;
    }
    try {
        await TaskService.createTask({ name: newTaskName, description: "", project_id: projectId });
        toast.success("Tạo công việc mới thành công.");
        setNewTaskName("");
        fetchTasksAndProject(); // Tải lại dữ liệu
    } catch (error) {
        toast.error("Lỗi khi tạo công việc.");
    }
  }

  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);
  
  if (!projectId) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Chọn một dự án để xem công việc.</div>;
  }
  
  if (isLoading) {
    return <div className="p-4 space-y-2">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Công việc của dự án: {project?.name}</h2>
            {isRefetching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
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
        <div className="border rounded-lg min-h-[200px]">
            {taskTree.length > 0 ? taskTree.map(task => (
                <RenderTaskNode 
                    key={task._id} 
                    task={task} 
                    level={0} 
                    projectMembers={project?.members || []}
                    onActionComplete={fetchTasksAndProject}
                />
            )) : (
                <p className="text-center text-sm text-muted-foreground p-8">Dự án này chưa có công việc nào.</p>
            )}
        </div>
    </div>
  );
}