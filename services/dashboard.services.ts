import { defaultAxiosInstance } from '@/config/axios.config';

// --- ĐỊNH NGHĨA CÁC PAYLOAD VÀ INTERFACE ---

// Interface cho payload tìm kiếm bảng lương
interface SearchPayrollsPayload {
  searchCondition: {
    keyword?: string;
    month?: number;
    year?: number;
  };
  pageInfo: {
    pageNum: number;
    pageSize: number;
  };
}

// Interface cho dữ liệu thống kê dashboard
export interface DashboardStats {
  employeeCount: number;
  adminCount: number;
  projectCount: number;
  taskCount: number;
  totalSalaryPaid: number;
  totalBaseSalaryPaid: number;
  totalDiligenceBonusPaid: number;
  totalPerformanceBonusPaid: number;
  totalOtherBonusPaid: number;
}


class DashboardService {
  /**
   * Lấy các số liệu thống kê tổng quan cho dashboard.
   * Gửi request GET tới /api/admin/dashboard-stats
   */
  static async getDashboardStats() {
    const response = await defaultAxiosInstance.get('/api/admin/dashboard-stats');
    return response.data;
  }

  /**
   * Tìm kiếm và lấy danh sách các bảng lương gần đây.
   * Gửi request POST tới /api/payroll/search
   */
  static async searchRecentPayrolls(data: SearchPayrollsPayload) {
    const response = await defaultAxiosInstance.post('/api/payroll/search', data);
    return response.data;
  }
}

export default DashboardService;