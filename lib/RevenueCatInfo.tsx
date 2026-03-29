import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

export const RevenueCatInfo = () => {
  const openRevenueCatDocs = () => {
    Linking.openURL('https://www.revenuecat.com/docs/getting-started/installation/expo');
  };

  return (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>RevenueCat Integration Required</Text>
      <Text style={styles.infoText}>
        To enable in-app purchases for Premium subscriptions, this app needs to be exported
        and opened locally (e.g., in Cursor or VS Code) to install the RevenueCat SDK.
      </Text>
      <Text style={styles.infoText}>
        RevenueCat handles Apple In-App Purchases and Google Play Billing automatically
        and requires native code that cannot run in the browser preview.
      </Text>
      <TouchableOpacity style={styles.linkButton} onPress={openRevenueCatDocs}>
        <ExternalLink size={20} color="#10b981" strokeWidth={2} />
        <Text style={styles.linkText}>View RevenueCat Setup Guide</Text>
      </TouchableOpacity>
      <Text style={styles.noteText}>
        Note: For now, the app uses a demo subscription system for testing purposes.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noteText: {
    fontSize: 12,
    color: '#166534',
    fontStyle: 'italic',
  },
});
