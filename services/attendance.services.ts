import { defaultAxiosInstance } from '@/config/axios.config';

interface SearchAttendancesParams {
  searchCondition: {
    keyword: string;
    date_from: string; // YYYY-MM-DD
    date_to: string;   // YYYY-MM-DD
  };
  pageInfo: {
    pageNum: number;
    pageSize: number; 
  };
}

class AttendanceService {
  static async searchAttendances(data: SearchAttendancesParams) {
    const response = await defaultAxiosInstance.post('/api/admin/attendances/search', data);
    return response.data;
  }
}

export default AttendanceService;