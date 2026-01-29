import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiService } from '../../services/api';
import { VideoPlayer } from '../../components/VideoPlayer';

export default function VideoPlayerScreen() {
    const { id, token, title } = useLocalSearchParams<{
        id: string;
        token: string;
        title: string;
    }>();
    
    const [youtubeId, setYoutubeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadVideo();
    }, []);

    const loadVideo = async () => {
        if (!id || !token) {
            setError('Invalid video parameters');
            setLoading(false);
            return;
        }

        const result = await apiService.fetchVideoStream(id, token);

        if (result.success && result.data) {
            // Extract YouTube ID from embed URL
            const match = result.data.match(/embed\/([^?]+)/);
            if (match && match[1]) {
                setYoutubeId(match[1]);
            } else {
                setError('Invalid video format');
            }
        } else {
            setError(result.error || 'Failed to load video');
        }

        setLoading(false);
    };

    const handleReady = () => {
        if (id) {
            apiService.recordWatch(id);
        }
    };

    const handleBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading video...</Text>
            </View>
        );
    }

    if (error || !youtubeId) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'Failed to load video'}</Text>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (Platform.OS !== 'web') {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Video player is only available on web platform
                </Text>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                {title && (
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                )}
            </View>

            <VideoPlayer youtubeId={youtubeId} onReady={handleReady} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ff4444',
        marginBottom: 20,
        textAlign: 'center',
    },
    header: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
    },
    backButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});