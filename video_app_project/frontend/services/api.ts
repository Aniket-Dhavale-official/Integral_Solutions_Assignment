import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { StorageService } from '../utils/storage';

export interface Video {
    video_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    playback_token: string;
}

export interface DashboardResponse {
    success: boolean;
    videos: Video[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

class ApiService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = await StorageService.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    async fetchDashboard(): Promise<ApiResponse<Video[]>> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DASHBOARD}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data: DashboardResponse = await response.json();

            if (response.ok && data.success) {
                return { success: true, data: data.videos };
            }

            return { success: false, error: 'Failed to fetch videos' };
        } catch (error) {
            console.error('Dashboard API error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async fetchVideoStream(videoId: string, playbackToken: string): Promise<ApiResponse<string>> {
        try {
            const url = `${API_BASE_URL}${API_ENDPOINTS.VIDEO.STREAM(videoId)}?token=${playbackToken}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok && data.embed_url) {
                return { success: true, data: data.embed_url };
            }

            return { success: false, error: data.error || 'Failed to fetch video stream' };
        } catch (error) {
            console.error('Video stream API error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async recordWatch(videoId: string): Promise<ApiResponse<void>> {
        try {
            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.VIDEO.WATCH(videoId)}`,
                {
                    method: 'POST',
                    headers: await this.getAuthHeaders(),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true };
            }

            return { success: false, error: data.error || 'Failed to record watch' };
        } catch (error) {
            console.error('Record watch API error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async logout(): Promise<boolean> {
        try {
            const token = await StorageService.getToken();
            
            if (token) {
                console.log('Calling logout API...');
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                const data = await response.json();
                console.log('Logout API response:', data);
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear token regardless of API success
            await StorageService.clearAll();
            console.log('Logout completed');
        }
        
        return true;
    }

    async getUserProfile(): Promise<ApiResponse<{ full_name: string; email: string }>> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return {
                    success: true,
                    data: { full_name: data.full_name, email: data.email },
                };
            }

            return { success: false, error: data.error || 'Failed to fetch profile' };
        } catch (error) {
            console.error('Profile API error:', error);
            return { success: false, error: 'Network error' };
        }
    }
}

export const apiService = new ApiService();