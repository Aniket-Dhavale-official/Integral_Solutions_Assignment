import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VideoPlayerScreen = ({ route, navigation }) => {
    const { video, playbackToken } = route.params;
    const videoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef(null);

    const videoUrl = `http://localhost:5000/video/${video.id}/stream?token=${playbackToken}`;

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    const handleLoadStart = () => {
        setLoading(true);
    };

    const handleLoad = (data) => {
        setLoading(false);
        setDuration(data.duration);
    };

    const handleError = (error) => {
        setLoading(false);
        setError('Failed to load video. Please try again.');
        Alert.alert('Error', 'Failed to load video');
    };

    const handleProgress = (data) => {
        setCurrentTime(data.currentTime);
    };

    const togglePlayPause = () => {
        setPlaying(!playing);
    };

    const toggleMute = () => {
        setMuted(!muted);
    };

    const handleSeek = (time) => {
        if (videoRef.current) {
            videoRef.current.seek(time);
        }
    };

    const showControls = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden={true} />

            {/* Back Button Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>
                    {video.title}
                </Text>
                <View style={styles.spacer} />
            </View>

            {/* Video Player */}
            <TouchableOpacity
                style={styles.videoContainer}
                onPress={showControls}
                activeOpacity={1}
            >
                <Video
                    ref={videoRef}
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    paused={!playing}
                    muted={muted}
                    controls={false}
                    onLoadStart={handleLoadStart}
                    onLoad={handleLoad}
                    onError={handleError}
                    onProgress={handleProgress}
                    resizeMode="contain"
                    progressUpdateInterval={250}
                />

                {/* Loading Indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                )}

                {/* Error State */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Custom Controls Overlay */}
                {controlsVisible && (
                    <View style={styles.controlsOverlay}>
                        {/* Top Controls */}
                        <View style={styles.topControls}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Center Play/Pause Button */}
                        <TouchableOpacity
                            style={styles.centerButton}
                            onPress={togglePlayPause}
                        >
                            <Text style={styles.playPauseIcon}>
                                {playing ? '⏸' : '▶'}
                            </Text>
                        </TouchableOpacity>

                        {/* Bottom Controls */}
                        <View style={styles.bottomControls}>
                            {/* Progress Bar */}
                            <View style={styles.progressBarContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.progressBar,
                                        { width: `${progressPercentage}%` },
                                    ]}
                                    onPress={(e) => {
                                        const { nativeEvent } = e;
                                        const containerWidth = 300;
                                        const touchX =
                                            nativeEvent.locationX || nativeEvent.pageX;
                                        const seekTime =
                                            (touchX / containerWidth) * duration;
                                        handleSeek(seekTime);
                                    }}
                                />
                            </View>

                            {/* Time and Controls Row */}
                            <View style={styles.timeControlsRow}>
                                <Text style={styles.timeText}>
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </Text>

                                <View style={styles.rightControls}>
                                    <TouchableOpacity
                                        onPress={toggleMute}
                                        hitSlop={{
                                            top: 10,
                                            bottom: 10,
                                            left: 10,
                                            right: 10,
                                        }}
                                    >
                                        <Text style={styles.muteButton}>
                                            {muted ? '🔇' : '🔊'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>

            {/* Video Details */}
            <View style={styles.detailsContainer}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoDescription}>{video.description}</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginHorizontal: 12,
        textAlign: 'center',
    },
    spacer: {
        width: 50,
    },
    videoContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    errorContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    controlsOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    closeButton: {
        fontSize: 28,
        color: '#fff',
    },
    centerButton: {
        alignSelf: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseIcon: {
        fontSize: 32,
        color: '#007AFF',
        marginLeft: 2,
    },
    bottomControls: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    timeControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    rightControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    muteButton: {
        fontSize: 20,
        marginLeft: 12,
    },
    detailsContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    videoDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default VideoPlayerScreen;
