/**
 * Local AI – Main Entry (React Native / Expo stub)
 * الواجهة الأساسية حسب المواصفات: Dark / Premium
 *
 * هذا ملف أولي – يحتاج ربط كامل بالـ UI Components
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar } from 'react-native';
import { AICore } from './src/ai-core/AICore';
import { colors } from './src/ui/theme';
import { BUNDLED_QWEN } from './src/ai-core/model-manager/ModelManager';

export default function App() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [aiCore] = useState(() => new AICore());

  useEffect(() => {
    (async () => {
      try {
        await aiCore.initialize();
        const device = aiCore.modelManager.getDeviceInfo();
        setStatus(
          `Ready • ${BUNDLED_QWEN.name} • Local • Capability: ${device?.capability ?? 'UNKNOWN'}`
        );
        setReady(true);
      } catch (e: any) {
        setStatus(`Init failed: ${e?.message}`);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Local AI</Text>
        <Text style={styles.modelName}>
          {BUNDLED_QWEN.name} • Running locally
        </Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      {/* Chat Area placeholder */}
      <View style={styles.chatArea}>
        <Text style={styles.placeholder}>
          🧠 Local AI{'\n'}
          ⚡ Fast Model{'\n'}
          🔒 On Device{'\n\n'}
          Chat • Models • Tools • Files • Settings
        </Text>
      </View>

      {/* Composer placeholder */}
      <View style={styles.composer}>
        <Text style={styles.composerHint}>Ask anything...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  modelName: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 4,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
  composer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerHint: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
