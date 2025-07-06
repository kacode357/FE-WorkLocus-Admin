import { defaultAxiosInstance } from '@/config/axios.config';

// --- ĐỊNH NGHĨA CÁC PAYLOAD VÀ PARAMS ---

// Payload cho việc tạo hoặc cập nhật một đánh giá
interface CreateOrUpdateReviewPayload {
    user_id: string;
    month: number;
    year: number;
    grade: string;
    notes: string;
}

// Params cho việc lấy danh sách đánh giá (sẽ được chuyển thành query string)
interface GetReviewsParams {
    user_id?: string;
    month?: number;
    year?: number;
    pageNum?: number;
    pageSize?: number;
}

class ReviewService {
    /**
     * Tạo hoặc cập nhật đánh giá hàng tháng cho một nhân viên.
     * Gửi request POST tới /api/reviews
     */
    static async createOrUpdateReview(data: CreateOrUpdateReviewPayload) {
        const response = await defaultAxiosInstance.post('/api/reviews', data);
        return response.data;
    }

    /**
     * Lấy danh sách các bản đánh giá theo bộ lọc.
     * Gửi request GET tới /api/reviews với các tham số trên URL.
     */
    static async getReviews(params: GetReviewsParams) {
        const response = await defaultAxiosInstance.get('/api/reviews', {
            params: params // Axios sẽ tự động chuyển object này thành query string
        });
        return response.data;
    }
}

export default ReviewService;