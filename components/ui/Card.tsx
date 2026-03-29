import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'premium' | 'gradient';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(34, 197, 94, 0.05)', 'rgba(16, 185, 129, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  default: {
    ...theme.shadows.sm,
  },
  elevated: {
    ...theme.shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  premium: {
    ...theme.shadows.xl,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  gradientCard: {
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
});
