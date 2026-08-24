/**
 * Settings Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing } from './theme';
import { SettingsStore, AppSettings } from '../storage/settings/SettingsStore';
import { AICore } from '../ai-core/AICore';

interface Props {
  aiCore: AICore;
  settingsStore: SettingsStore;
  onBack: () => void;
}

export function SettingsScreen({ aiCore, settingsStore, onBack }: Props) {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.get());
  const device = aiCore.modelManager.getDeviceInfo();

  const update = async (partial: Partial<AppSettings>) => {
    const next = await settingsStore.save(partial);
    setSettings(next);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Local-First</Text>
        <Text style={styles.note}>
          All conversations and models stay on your device. No central AI server is used.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generation</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Streaming</Text>
          <Switch
            value={settings.enableStreaming}
            onValueChange={(v) => update({ enableStreaming: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Auto release memory</Text>
          <Switch
            value={settings.autoReleaseMemory}
            onValueChange={(v) => update({ autoReleaseMemory: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Show confidence</Text>
          <Switch
            value={settings.showConfidence}
            onValueChange={(v) => update({ showConfidence: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>
        <Text style={styles.meta}>Capability: {device?.capability || '—'}</Text>
        <Text style={styles.meta}>RAM: ~{device?.ramGB || '?'} GB</Text>
        <Text style={styles.meta}>Arch: {device?.architecture || '—'}</Text>
        <Text style={styles.meta}>OS: {device?.os} {device?.osVersion}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.meta}>Local AI – On-Device Qwen</Text>
        <Text style={styles.meta}>No central server • Privacy first</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.primary, fontSize: 16, marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  section: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  note: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  label: { color: colors.text, fontSize: 15 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
