import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface TouchableScaleProps extends Omit<TouchableOpacityProps, 'onPress'> {
  onPress?: () => void;
  scaleValue?: number;
}

export const TouchableScale: React.FC<TouchableScaleProps> = ({
  children,
  onPress,
  scaleValue = 0.95,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(scaleValue, {
        damping: 15,
        stiffness: 300,
      });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    })
    .onEnd(() => {
      if (onPress) {
        onPress();
      }
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[style, animatedStyle]}>
        <TouchableOpacity activeOpacity={1} {...props}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};
