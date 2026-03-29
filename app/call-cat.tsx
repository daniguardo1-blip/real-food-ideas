import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Volume2, RotateCcw, Play, Pause } from 'lucide-react-native';
import { useLanguage } from '@/lib/LanguageContext';
import { Audio } from 'expo-av';

const AUDIO_URL = 'https://files.catbox.moe/8y0qcg';

export default function CallCatScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: AUDIO_URL },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error playing sound:', err);
      setError(language === 'es' ? 'No se pudo cargar el audio' : 'Could not load audio');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Error pausing sound:', err);
    }
  };

  const resumeSound = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error resuming sound:', err);
    }
  };

  const replaySound = async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        await playSound();
      }
    } catch (err) {
      console.error('Error replaying sound:', err);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) {
      await playSound();
    } else if (isPlaying) {
      await pauseSound();
    } else {
      await resumeSound();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#10b981" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Llama a tu gato' : 'Call your cat'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Volume2 size={64} color="#f97316" strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>
            {language === 'es' ? 'Llama a tu gato' : 'Call your cat'}
          </Text>

          <Text style={styles.description}>
            {language === 'es'
              ? 'Reproduce un sonido para llamar la atención de tu gato'
              : 'Play a sound to get your cat\'s attention'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={togglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.playButtonText}>
                  {language === 'es' ? 'Cargando...' : 'Loading...'}
                </Text>
              ) : (
                <>
                  {isPlaying ? (
                    <Pause size={28} color="#ffffff" strokeWidth={2} />
                  ) : (
                    <Play size={28} color="#ffffff" strokeWidth={2} />
                  )}
                  <Text style={styles.playButtonText}>
                    {isPlaying
                      ? language === 'es'
                        ? 'Pausar sonido'
                        : 'Pause sound'
                      : language === 'es'
                      ? 'Reproducir sonido'
                      : 'Play sound'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {sound && (
              <TouchableOpacity
                style={styles.replayButton}
                onPress={replaySound}
                disabled={isLoading}
              >
                <RotateCcw size={24} color="#f97316" strokeWidth={2} />
                <Text style={styles.replayButtonText}>
                  {language === 'es' ? 'Volver a reproducir' : 'Replay'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  controlsContainer: {
    width: '100%',
    gap: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 12,
  },
  playButtonActive: {
    backgroundColor: '#dc2626',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  replayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
  },
});
