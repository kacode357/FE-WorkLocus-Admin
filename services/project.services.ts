import { defaultAxiosInstance } from '@/config/axios.config';

const searchProjectsApi = async (data: {
    searchCondition: {
        keyword: string;
        is_deleted: boolean | null;
    };
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/projects/search', data);
    return response.data;
};
const createProjectApi = async (data: {
    name: string;
    description: string;
    type?: string;
}) => {
    const response = await defaultAxiosInstance.post('/api/projects', data);
    return response.data;
};
const deleteProjectApi = async (projectId: string) => {
    const response = await defaultAxiosInstance.delete(`/api/projects/${projectId}`);
    return response.data;
};

const completeProjectApi = async (projectId: string) => {
    const response = await defaultAxiosInstance.patch(`/api/projects/${projectId}/complete`);
    return response.data;
};
const addMemberToProjectApi = async (projectId: string, userId: string) => {
    const response = await defaultAxiosInstance.post(`/api/admin/projects/${projectId}/add-member`, {
        userId,
    });
    return response.data;
};
const removeMemberFromProjectApi = async (projectId: string, memberId: string) => {
    const response = await defaultAxiosInstance.delete(`/api/projects/${projectId}/members/${memberId}`);
    return response.data;
};
const updateProjectApi = async (projectId: string, data: { name: string; description: string }) => {
  const response = await defaultAxiosInstance.put(`/api/projects/${projectId}`, data);
  return response.data;
};

export { updateProjectApi ,removeMemberFromProjectApi,searchProjectsApi, createProjectApi, deleteProjectApi, completeProjectApi, addMemberToProjectApi };
