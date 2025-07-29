import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '../types';

class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('beauty_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('beauty_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  async post<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T = unknown>(url: string): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  async patch<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
