import { Platform } from 'react-native';

export const API_BASE_URL = Platform.select({
    android: 'http://localhost:5000',  // Changed from 10.0.2.2
    ios: 'http://localhost:5000',
    web: 'http://localhost:5000',
    default: 'http://localhost:5000',
}) as string;

export const API_ENDPOINTS = {
    AUTH: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
    },
    DASHBOARD: '/dashboard',
    VIDEO: {
        STREAM: (id: string) => `/video/${id}/stream`,
        WATCH: (id: string) => `/video/${id}/watch`,
    },
};

console.log(`[${Platform.OS}] API URL:`, API_BASE_URL);