import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const StorageService = {
    async saveToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            console.log('Token saved successfully');
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },

    async getToken(): Promise<string | null> {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            console.log('Token retrieved:', token ? 'exists' : 'null');
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            console.log('Token removed successfully');
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.clear();
            console.log('All storage cleared');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};