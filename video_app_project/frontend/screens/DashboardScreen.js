import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoTile from '../components/VideoTile';

const DashboardScreen = ({ navigation }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setError(null);
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please login again.');
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://localhost:5000/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                await AsyncStorage.removeItem('authToken');
                navigation.replace('Login');
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setVideos(data.videos || []);
            } else {
                setError(data.message || 'Failed to load dashboard');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const handleVideoPress = (video) => {
        if (!video.playbackToken) {
            Alert.alert('Error', 'Playback token not available for this video.');
            return;
        }

        navigation.navigate('VideoPlayer', {
            video,
            playbackToken: video.playbackToken,
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Videos</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : videos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No videos available</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#007AFF"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {videos.slice(0, 2).map((video, index) => (
                        <VideoTile
                            key={video.id || index}
                            thumbnail={video.thumbnail}
                            title={video.title}
                            description={video.description}
                            onPress={() => handleVideoPress(video)}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingVertical: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default DashboardScreen;
