import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 120 }: LogoProps) {
  const { colors } = useTheme();
  const glowRadius = size * 0.55;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
            <Stop offset="70%" stopColor={colors.primary} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={glowRadius} fill="url(#sealGlow)" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.38}
          fill={colors.surfaceContainerLowest}
          stroke={colors.primary}
          strokeWidth={2.5}
        />
        <SvgText
          x={size / 2}
          y={size / 2 + size * 0.06}
          textAnchor="middle"
          fontSize={size * 0.28}
          fill={colors.primary}
          fontFamily="NotoSerifJP_400Regular"
        >
          日本
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
