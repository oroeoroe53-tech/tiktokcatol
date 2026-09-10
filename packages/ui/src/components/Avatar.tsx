import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

export interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  verified?: boolean;
  ringColor?: string;
}

export function Avatar({ uri, name, size = 44, verified, ringColor }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const ring = ringColor ?? (verified ? colors.accent : 'transparent');

  return (
    <View
      style={[
        styles.ring,
        { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: ring },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fontFamily.bodyBold, color: colors.primary },
});
