import { defaultAxiosInstance } from '@/config/axios.config';

// --- ĐỊNH NGHĨA CÁC PAYLOAD ĐỂ DÙNG LẠI ---
interface BonusPayload {
    grade: string;
    bonus_amount: number;
    description: string;
}

interface SearchPayload {
    searchCondition: {
        keyword: string;
        is_deleted?: boolean | null;
    };
    pageInfo: {
        pageNum: number;
        pageSize: number;
    };
}

class BonusService {
    // TÌM KIẾM
    static async searchBonuses(data: SearchPayload) {
        const response = await defaultAxiosInstance.post('/api/bonuses/search', data);
        return response.data;
    }

    // TẠO MỚI
    static async createBonus(data: BonusPayload) {
        const response = await defaultAxiosInstance.post('/api/bonuses', data);
        return response.data;
    }

    // CẬP NHẬT (UPDATE)
    static async updateBonus(bonusId: string, data: BonusPayload) {
        const response = await defaultAxiosInstance.patch(`/api/bonuses/${bonusId}`, data);
        return response.data;
    }

    // XÓA
    static async deleteBonus(bonusId: string) {
        const response = await defaultAxiosInstance.delete(`/api/bonuses/${bonusId}`);
        return response.data;
    }
}

export default BonusService;