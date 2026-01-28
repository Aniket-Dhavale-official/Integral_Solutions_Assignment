import React from 'react';
import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

const VideoTile = ({ thumbnail, title, description, onPress, loading = false }) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.7}
        >
            <View style={styles.thumbnailContainer}>
                {thumbnail ? (
                    <Image
                        source={{ uri: thumbnail }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderThumbnail}>
                        <ActivityIndicator color="#007AFF" size="large" />
                    </View>
                )}
                <View style={styles.overlay} />
                <View style={styles.playButtonContainer}>
                    <View style={styles.playButton}>
                        <Text style={styles.playIcon}>▶</Text>
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                    {description}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 15,
        marginVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    thumbnailContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButtonContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 24,
        color: '#007AFF',
        marginLeft: 3,
    },
    contentContainer: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 6,
    },
    description: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
});

export default VideoTile;
