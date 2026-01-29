import { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface VideoPlayerProps {
  youtubeId: string;
}

export const VideoPlayer = ({ youtubeId }: VideoPlayerProps) => {
  const webViewRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const postCommand = (command: string) => {
    webViewRef.current?.injectJavaScript(`
      if (player && player.${command}) {
        player.${command}();
      }
      true;
    `);
  };

  // ---------- ANDROID / IOS ----------
  if (Platform.OS !== 'web') {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;background:black;">
        <div id="player"></div>

        <script src="https://www.youtube.com/iframe_api"></script>
        <script>
          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              videoId: '${youtubeId}',
              playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                fs: 0,
                playsinline: 1
              },
              events: {
                onStateChange: e => {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({ state: e.data })
                  );
                }
              }
            });
          }
        </script>
      </body>
      </html>
    `;

    return (
      <View>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={{ height: 220 }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={e => {
            const { state } = JSON.parse(e.nativeEvent.data);
            setIsPlaying(state === 1);
          }}
        />

        <Controls
          isPlaying={isPlaying}
          onPlay={() => postCommand('playVideo')}
          onPause={() => postCommand('pauseVideo')}
        />
      </View>
    );
  }

  // ---------- WEB ----------
  return (
    <View>
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?controls=0&rel=0&modestbranding=1`}
        style={{ width: '100%', height: 220, border: 'none' }}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />

      <Text style={styles.webNote}>
        Controls disabled on web by design
      </Text>
    </View>
  );
};

const Controls = ({ isPlaying, onPlay, onPause }: any) => (
  <View style={styles.controls}>
    <TouchableOpacity
      style={styles.button}
      onPress={isPlaying ? onPause : onPlay}
    >
      <Text style={styles.text}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  controls: {
    padding: 12,
    backgroundColor: '#111',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  webNote: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
  },
});