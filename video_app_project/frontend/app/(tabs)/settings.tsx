import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../services/api';

export default function SettingsScreen() {
    const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const result = await apiService.getUserProfile();

        if (result.success && result.data) {
            setProfile(result.data);
        } else {
            Alert.alert('Error', result.error || 'Failed to load profile');
        }

        setLoading(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await apiService.logout();
                        router.replace('/auth/login');
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    profileSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});