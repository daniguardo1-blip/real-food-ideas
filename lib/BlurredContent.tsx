import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Crown, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BlurredContentProps {
  children: React.ReactNode;
  message: string;
  showButton?: boolean;
  buttonText?: string;
}

export const BlurredContent: React.FC<BlurredContentProps> = ({
  children,
  message,
  showButton = true,
  buttonText = 'Desbloquear con Premium',
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.blurredContent}>
        <BlurView intensity={100} style={styles.blurOverlay} tint="light">
          {children}
        </BlurView>
        <View style={styles.lockMessageContainer}>
          <Text style={styles.lockMessage}>🔒 {message}</Text>
          {showButton && (
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.unlockButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 4,
  },
  blurredContent: {
    position: 'relative',
    minHeight: 80,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockMessageContainer: {
    position: 'absolute',
    bottom: -32,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  lockMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
