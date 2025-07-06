import { defaultAxiosInstance } from '@/config/axios.config';

export interface Workplace {
    _id?: string;
    name: string;
    latitude: number;
    longitude: number;
    is_deleted?: boolean;
}

const createWorkplaceApi = async (payload: { name: string; latitude: number; longitude: number }) => {
    const response = await defaultAxiosInstance.post('/api/admin/workplaces', payload);
    return response.data;
};

const searchWorkplacesApi = async (payload: {
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/workplaces/search', payload);
    return response.data;
};

const updateWorkplaceApi = async (workplaceId: string, updateData: Partial<Workplace>) => {
    const response = await defaultAxiosInstance.patch(`/api/admin/workplaces/${workplaceId}`, updateData);
    return response.data;
};

const deleteWorkplaceApi = async (workplaceId: string) => {
    const response = await defaultAxiosInstance.delete(`/api/admin/workplaces/${workplaceId}`);
    return response.data;
};


// === API cho Admin Users (giữ nguyên các hàm mày đã có) ===
const searchAdminUsersApi = async (payload: {
    searchCondition: {
        keyword: string;
        is_activated: boolean | null;
        role: string;
    };
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/users/search', payload);
    return response.data;
};
const createEmployeeApi = async (payload: {
    full_name: string;
    email: string;
    password: string;
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/create-employee', payload);
    return response.data;
};
const createAdminApi = async (payload: {
    full_name: string;
    email: string;
    password: string;
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/create-admin', payload);
    return response.data;
};

const createTeamLeaderApi = async (payload: {
    full_name: string;
    email: string;
    password: string;
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/create-tl', payload);
    return response.data;
};

const createProjectManagerApi = async (payload: {
    full_name: string;
    email: string;
    password: string;
}) => {
    const response = await defaultAxiosInstance.post('/api/admin/create-pm', payload);
    return response.data;
};
const blockAdminUserApi = async (userId: string, payload: { reason: string }) => {
    const response = await defaultAxiosInstance.patch(`/api/admin/users/${userId}/block`, payload);
    return response.data;
};

const unblockAdminUserApi = async (userId: string) => {
    const response = await defaultAxiosInstance.patch(`/api/admin/users/${userId}/unblock`);
    return response.data;
};

const changeAdminUserPasswordApi = async (userId: string, payload: { newPassword: string }) => {
    const response = await defaultAxiosInstance.patch(`/api/admin/users/${userId}/change-password`, payload);
    return response.data;
};
const deleteAdminUserApi = async (userId: string) => {
    const response = await defaultAxiosInstance.delete(`/api/admin/users/${userId}`);
    return response.data;
};
const updateUserSalaryApi = async (userId: string, payload: { base_salary_per_day: number }) => {
    const response = await defaultAxiosInstance.put(`/api/admin/users/${userId}/salary`, payload);
    return response.data;
};

export {
    // Workplace APIs
    createWorkplaceApi,
    searchWorkplacesApi,
    updateWorkplaceApi,
    deleteWorkplaceApi,

    // Admin Users APIs
    updateUserSalaryApi,
    deleteAdminUserApi,
    blockAdminUserApi,
    unblockAdminUserApi,
    changeAdminUserPasswordApi,
    createEmployeeApi,
    createAdminApi,
    createTeamLeaderApi,
    createProjectManagerApi,
    searchAdminUsersApi,
};