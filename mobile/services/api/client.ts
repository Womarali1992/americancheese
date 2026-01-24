import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "@/stores/authStore";

// API URL: Uses environment variable in production, local IP for development
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.7:5000";

class ApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );

    // Monitor network status
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`[API] POST ${url}`, JSON.stringify(data, null, 2));
    try {
      const response = await this.client.post<T>(url, data, config);
      console.log(`[API] POST ${url} success:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error(`[API] POST ${url} error:`, error?.response?.status, error?.response?.data || error?.message);
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }
}

export const apiClient = new ApiClient();
