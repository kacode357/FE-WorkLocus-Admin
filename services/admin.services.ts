import { defaultAxiosInstance } from '@/config/axios.config';

export interface Workplace {
    _id?: string; // id có thể không cần khi tạo/update
    name: string;
    latitude: number;  // API trả về number
    longitude: number; // API trả về number
}

const updateWorkplaceApi = async (payload: Workplace) => {
    const response = await defaultAxiosInstance.put('/api/admin/workplace', payload);
    return response.data;
};
const getWorkplacesApi = async () => {
    const response = await defaultAxiosInstance.get('/api/admin/workplace');
    return response.data;
};
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
    getWorkplacesApi,
    updateWorkplaceApi,
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
