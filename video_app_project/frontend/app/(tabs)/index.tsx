import { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
    SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { apiService, Video } from '../../services/api';
import { StorageService } from '../../utils/storage';

export default function DashboardScreen() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVideos = useCallback(async () => {
        const result = await apiService.fetchDashboard();

        if (result.success && result.data) {
            setVideos(result.data);
        } else {
            Alert.alert('Error', result.error || 'Failed to load videos');
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadVideos();
    }, [loadVideos]);

    const handleVideoPress = useCallback((video: Video) => {
        router.push({
            pathname: '/video/[id]' as any,
            params: {
                id: video.video_id,
                token: video.playback_token,
                title: video.title,
            },
        });
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { 
                    text: 'Cancel', 
                    style: 'cancel' 
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('Logout button pressed');
                        
                        try {
                            // Call logout service
                            await apiService.logout();
                            console.log('Logout service completed');
                            
                            // Double-check token is cleared
                            const token = await StorageService.getToken();
                            console.log('Token after logout:', token);
                            
                            // Navigate to login
                            console.log('Navigating to login...');
                            router.replace('/auth/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                            // Still try to navigate even if error
                            await StorageService.clearAll();
                            router.replace('/auth/login');
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const renderVideoItem = ({ item }: { item: Video }) => (
        <TouchableOpacity
            style={styles.videoCard}
            onPress={() => handleVideoPress(item)}
            activeOpacity={0.7}
        >
            {item.thumbnail_url ? (
                <Image
                    source={{ uri: item.thumbnail_url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.thumbnailPlaceholder}>
                    <Text style={styles.playIcon}>▶</Text>
                </View>
            )}
            
            <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.videoDescription} numberOfLines={3}>
                    {item.description}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos available</Text>
            <TouchableOpacity onPress={loadVideos} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <TouchableOpacity 
                    onPress={handleLogout} 
                    style={styles.logoutButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={videos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.video_id}
                contentContainerStyle={[
                    styles.listContent,
                    videos.length === 0 && styles.listContentEmpty,
                ]}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                        tintColor="#007AFF"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
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
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#ff4444',
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        padding: 16,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#007AFF',
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    videoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    thumbnail: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 60,
        color: '#fff',
        opacity: 0.8,
    },
    videoInfo: {
        padding: 16,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 24,
    },
    videoDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});