import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface VideoThumbnailProps {
  uri: string;
  style?: any;
  showPlayIcon?: boolean;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ 
  uri, 
  style, 
  showPlayIcon = true 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {!error ? (
        <>
          <Image
            source={{ uri }}
            style={styles.thumbnail}
            resizeMode="cover"
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
          {showPlayIcon && !loading && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🎥</Text>
          <Text style={styles.errorText}>Video</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#34495e',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 2, // Để căn giữa icon play
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34495e',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default VideoThumbnail;