import { defaultAxiosInstance } from '@/config/axios.config';

// --- ĐỊNH NGHĨA CÁC PAYLOAD ĐỂ DÙNG LẠI ---

// Payload cho việc tính lương
interface CalculatePayrollPayload {
    user_id: string;
    month: number;
    year: number;
    diligence_required_days: number;
    diligence_bonus_amount: number;
    other_bonus?: number;
}

// Payload cho việc tìm kiếm lịch sử lương
interface SearchPayrollsPayload {
    searchCondition: {
        keyword?: string;
        user_id?: string;
        month?: number;
        year?: number;
    };
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}

class PayrollService {
    /**
     * Gửi yêu cầu tính lương cho một nhân viên trong một tháng cụ thể.
     * @param data Dữ liệu đầu vào để tính lương.
     */
    static async calculatePayroll(data: CalculatePayrollPayload) {
        const response = await defaultAxiosInstance.post('/api/payroll/calculate', data);
        return response.data;
    }

    /**
     * Tìm kiếm và lấy danh sách lịch sử các bảng lương đã được tính.
     * @param data Các điều kiện tìm kiếm và thông tin phân trang.
     */
    static async searchPayrolls(data: SearchPayrollsPayload) {
        const response = await defaultAxiosInstance.post('/api/payroll/search', data);
        return response.data;
    }
}

export default PayrollService;