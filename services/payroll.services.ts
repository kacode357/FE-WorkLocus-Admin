import { defaultAxiosInstance } from '@/config/axios.config';

// --- ĐỊNH NGHĨA CÁC PAYLOAD ĐỂ DÙNG LẠI ---

// Payload cho việc tính lương
export interface CalculatePayrollPayload {
    user_id: string;
    month: number;
    year: number;
    diligence_required_days: number;
    diligence_bonus_amount: number;
    other_bonus?: number;
    ot_coefficient?: number; // Thêm hệ số OT, mặc định 1.2 (nếu backend hỗ trợ)
    dev_mode?: boolean;      // Bật chế độ test để chỉ lấy ngày có attendance
}

// Payload cho việc tìm kiếm lịch sử lương
export interface SearchPayrollsPayload {
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

    /**
     * Lấy thống kê chấm công của một nhân viên trong khoảng thời gian.
     * @param userId Id nhân viên
     * @param date_from Ngày bắt đầu (yyyy-mm-dd)
     * @param date_to   Ngày kết thúc (yyyy-mm-dd)
     */
    static async getUserAttendanceSummary(userId: string, date_from: string, date_to: string) {
        const response = await defaultAxiosInstance.get(
            `/api/admin/users/${userId}/attendance-summary`,
            { params: { date_from, date_to } }
        );
        return response.data;
    }
}

export default PayrollService;
