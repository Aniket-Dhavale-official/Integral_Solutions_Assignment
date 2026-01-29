import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

// Conditional import - only import WebView if available
let WebView: any = null;
if (Platform.OS !== 'web') {
    try {
        WebView = require('react-native-webview').WebView;
    } catch (e) {
        console.log('WebView not available');
    }
}

interface VideoPlayerProps {
    youtubeId: string;
    onReady?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ youtubeId, onReady }) => {
    const playerRef = useRef<any>(null);
    const webViewRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Web implementation
    useEffect(() => {
        if (Platform.OS !== 'web') {
            if (onReady) {
                setTimeout(onReady, 1000);
            }
            return;
        }

        const loadYouTubeAPI = () => {
            if ((window as any).YT && (window as any).YT.Player) {
                initializePlayer();
            } else {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

                (window as any).onYouTubeIframeAPIReady = () => {
                    initializePlayer();
                };
            }
        };

        const initializePlayer = () => {
            if (containerRef.current && !playerRef.current) {
                containerRef.current.innerHTML = '';
                
                const playerDiv = document.createElement('div');
                playerDiv.id = 'yt-player-' + Math.random().toString(36).substr(2, 9);
                containerRef.current.appendChild(playerDiv);

                const style = document.createElement('style');
                style.innerHTML = `
                    .video-container {
                        position: relative;
                        width: 100%;
                        aspect-ratio: 16/9;
                        background-color: #000;
                        overflow: hidden;
                    }
                    .video-container iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                        pointer-events: none;
                    }
                    .video-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 999;
                        pointer-events: auto;
                        cursor: default;
                    }
                `;
                document.head.appendChild(style);

                const overlay = document.createElement('div');
                overlay.className = 'video-overlay';
                overlay.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }, true);
                overlay.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }, true);
                containerRef.current.appendChild(overlay);

                playerRef.current = new (window as any).YT.Player(playerDiv.id, {
                    videoId: youtubeId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        iv_load_policy: 3,
                        playsinline: 1,
                        autohide: 1,
                        cc_load_policy: 0,
                        enablejsapi: 1,
                    },
                    events: {
                        onReady: (event: any) => {
                            if (onReady) onReady();
                        },
                        onStateChange: (event: any) => {
                            setIsPlaying(event.data === 1);
                        },
                    },
                });
            }
        };

        loadYouTubeAPI();

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [youtubeId]);

    const handlePlayPause = () => {
        if (Platform.OS === 'web') {
            if (!playerRef.current) return;
            if (isPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        } else {
            const command = isPlaying ? 'pauseVideo' : 'playVideo';
            webViewRef.current?.injectJavaScript(`
                if (typeof player !== 'undefined') {
                    player.${command}();
                }
                true;
            `);
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = () => {
        if (Platform.OS === 'web') {
            if (!playerRef.current) return;
            const currentTime = playerRef.current.getCurrentTime();
            const newTime = Math.max(0, currentTime - 10);
            playerRef.current.seekTo(newTime, true);
        } else {
            webViewRef.current?.injectJavaScript(`
                if (typeof player !== 'undefined') {
                    var currentTime = player.getCurrentTime();
                    player.seekTo(Math.max(0, currentTime - 10), true);
                }
                true;
            `);
        }
    };

    const handleMuteUnmute = () => {
        if (Platform.OS === 'web') {
            if (!playerRef.current) return;
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } else {
            const command = isMuted ? 'unMute' : 'mute';
            webViewRef.current?.injectJavaScript(`
                if (typeof player !== 'undefined') {
                    player.${command}();
                }
                true;
            `);
            setIsMuted(!isMuted);
        }
    };

    // Android/iOS implementation using WebView
    if (Platform.OS !== 'web') {
        if (!WebView) {
            return (
                <View style={styles.container}>
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageTitle}>📱 Mobile View</Text>
                        <Text style={styles.messageText}>
                            Please install react-native-webview to view videos on mobile.
                        </Text>
                        <Text style={styles.messageSubtext}>
                            Run: npx expo install react-native-webview
                        </Text>
                    </View>
                </View>
            );
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; }
                    body { 
                        background: #000; 
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    #player { 
                        width: 100%;
                        height: 100%;
                    }
                </style>
            </head>
            <body>
                <div id="player"></div>
                <script src="https://www.youtube.com/iframe_api"></script>
                <script>
                    var player;
                    function onYouTubeIframeAPIReady() {
                        player = new YT.Player('player', {
                            videoId: '${youtubeId}',
                            width: '100%',
                            height: '100%',
                            playerVars: {
                                controls: 0,
                                modestbranding: 1,
                                rel: 0,
                                fs: 0,
                                playsinline: 1,
                                disablekb: 1
                            },
                            events: {
                                'onReady': onPlayerReady,
                                'onStateChange': onPlayerStateChange
                            }
                        });
                    }
                    
                    function onPlayerReady(event) {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'ready'
                            }));
                        }
                    }
                    
                    function onPlayerStateChange(event) {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'stateChange',
                                state: event.data
                            }));
                        }
                    }
                </script>
            </body>
            </html>
        `;

        return (
            <View style={styles.container}>
                <View style={styles.webViewContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: htmlContent }}
                        style={styles.webview}
                        allowsFullscreenVideo={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        onMessage={(event: any) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'ready') {
                                    console.log('Video player ready');
                                } else if (data.type === 'stateChange') {
                                    setIsPlaying(data.state === 1);
                                }
                            } catch (e) {
                                console.error('Error parsing message:', e);
                            }
                        }}
                    />
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handlePlayPause}
                    >
                        <Text style={styles.buttonText}>
                            {isPlaying ? 'PAUSE' : 'PLAY'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleSeek}
                    >
                        <Text style={styles.buttonText}>SEEK -10s</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleMuteUnmute}
                    >
                        <Text style={styles.buttonText}>
                            {isMuted ? 'UNMUTE' : 'MUTE'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Web implementation
    return (
        <View style={styles.container}>
            <div 
                ref={containerRef}
                className="video-container"
            />

            <View style={styles.controls}>
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handlePlayPause}
                >
                    <Text style={styles.buttonText}>
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleSeek}
                >
                    <Text style={styles.buttonText}>SEEK -10s</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleMuteUnmute}
                >
                    <Text style={styles.buttonText}>
                        {isMuted ? 'UNMUTE' : 'MUTE'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#000',
    },
    messageContainer: {
        aspectRatio: 16 / 9,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    messageText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    messageSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    webViewContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#1a1a1a',
        gap: 10,
    },
    button: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});