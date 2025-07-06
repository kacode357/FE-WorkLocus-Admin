// File: src/services/task.services.ts
import { defaultAxiosInstance } from '@/config/axios.config';

interface SearchUsersParams {
    searchCondition: {
        keyword?: string;
        is_activated?: boolean | null;
        role?: string;
    };
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}

interface SearchAdminTasksParams {
  searchCondition: {
    keyword?: string;
    is_deleted?: boolean | null;
    project_id?: string;
  };
  pageInfo: {
    pageNum: number;
    pageSize: number; 
  };
}

// Interface cho tạo task (giữ nguyên)
interface CreateTaskParams {
  name: string;
  description: string;
  project_id: string;
  parent_id?: string;
}

// Interface cho cập nhật task (giữ nguyên từ lần sửa lỗi assignee_id)
interface UpdateTaskParams {
  name?: string; // name có thể là optional nếu chỉ update assignee
  assignee_id?: string | null; // Cho phép null để unassign
}

// Class TaskService của mày
class TaskService {
  static async searchAdminTasks(data: SearchAdminTasksParams) {
    const response = await defaultAxiosInstance.post('/api/admin/tasks/search', data);
    return response.data;
  }

  static async createTask(data: CreateTaskParams) {
    const response = await defaultAxiosInstance.post('/api/tasks', data);
    return response.data;
  }

  static async deleteTask(taskId: string) {
    const response = await defaultAxiosInstance.delete(`/api/tasks/${taskId}`);
    return response.data;
  }

  static async completeTask(taskId: string) {
    const response = await defaultAxiosInstance.post(`/api/tasks/${taskId}/complete`);
    return response.data;
  }

  static async updateTask(taskId: string, data: UpdateTaskParams) {
    const response = await defaultAxiosInstance.put(`/api/tasks/${taskId}`, data);
    return response.data;
  }
  static async searchProjectMembers(projectId: string, payload: SearchUsersParams) { // Đặt là static method
    const response = await defaultAxiosInstance.post(`/api/admin/projects/${projectId}/members/search`, payload);
    return response.data;
  }
}

export default TaskService;