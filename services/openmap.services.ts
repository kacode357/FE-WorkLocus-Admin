import axios from 'axios';

// Tạo một instance Axios riêng cho OpenMap API
const openMapAxiosInstance = axios.create({
  baseURL: 'https://mapapis.openmap.vn/v1',
  headers: {
    "Content-Type": "application/json",
  },
});

// Lấy token từ biến môi trường
const OPENMAP_apikey = process.env.NEXT_PUBLIC_OPENMAP_TOKEN;
console.log("OpenMap API Key:", OPENMAP_apikey);

// --- Định nghĩa các Type cho dữ liệu trả về ---
export interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetailsGoogle {
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        }
    };
    name: string;
    place_id: string;
}

export interface PlaceDetailsOpenMap {
    features: {
        properties: {
            name: string;
            label: string;
            website?: string;
            phone?: string;
        },
        geometry: {
            coordinates: [number, number]; // [lng, lat]
        }
    }[];
}


// --- Service Class ---
class OpenMapService {

  // Gợi ý địa chỉ
  static async autocomplete(input: string, sessiontoken: string) {
    const response = await openMapAxiosInstance.get<{ predictions: AutocompletePrediction[] }>('/autocomplete', {
      params: {
        apikey: OPENMAP_apikey,
        input,
        sessiontoken,
      }
    });
    return response.data;
  }

  // Lấy chi tiết địa điểm (dạng Google)
  static async getPlaceDetailsGoogleFormat(placeId: string, sessiontoken: string) {
    const response = await openMapAxiosInstance.get<{ result: PlaceDetailsGoogle }>('/place', {
      params: {
        apikey: OPENMAP_apikey,
        ids: placeId,
        sessiontoken,
        format: 'google',
      }
    });
    return response.data;
  }

  // Lấy chi tiết địa điểm (dạng OpenMap)
  static async getPlaceDetailsOpenMapFormat(placeId: string, sessiontoken: string) {
    const response = await openMapAxiosInstance.get<PlaceDetailsOpenMap>('/place', {
      params: {
        apikey: OPENMAP_apikey,
        ids: placeId,
        sessiontoken,
      }
    });
    return response.data;
  }
}

export default OpenMapService;