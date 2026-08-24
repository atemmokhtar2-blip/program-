/**
 * Local AI – Full Application Entry
 * Dark / Premium / Futuristic UI
 * Local-First • No Central AI Server
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AICore } from './src/ai-core/AICore';
import { ConversationStore } from './src/storage/conversations/ConversationStore';
import { SettingsStore } from './src/storage/settings/SettingsStore';
import { NetworkLayer } from './src/network/NetworkLayer';
import { ChatScreen } from './src/ui/ChatScreen';
import { ModelLibraryScreen } from './src/ui/ModelLibraryScreen';
import { SettingsScreen } from './src/ui/SettingsScreen';
import { colors } from './src/ui/theme';
import { Conversation } from './src/types';
import { BUNDLED_QWEN } from './src/ai-core/model-manager/ModelManager';

type Screen = 'chat' | 'models' | 'settings';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('chat');
  const [hasInternet, setHasInternet] = useState(false);

  const [aiCore] = useState(() => new AICore());
  const [conversationStore] = useState(() => new ConversationStore());
  const [settingsStore] = useState(() => new SettingsStore());
  const [network] = useState(() => new NetworkLayer());

  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await aiCore.initialize();
        await settingsStore.load();

        const conv = aiCore.context.createConversation('محادثة جديدة', BUNDLED_QWEN.id);
        await conversationStore.save(conv);
        setConversation(conv);

        const online = await network.isOnline();
        setHasInternet(online);

        setReady(true);
      } catch (e: any) {
        setError(e?.message || 'Initialization failed');
      }
    })();
  }, []);

  const handleUpdateConversation = useCallback(
    async (c: Conversation) => {
      setConversation(c);
      await conversationStore.save(c);
    },
    [conversationStore]
  );

  if (error) {
    return (
      <SafeAreaProvider>
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Text style={styles.errorTitle}>Task Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!ready || !conversation) {
    return (
      <SafeAreaProvider>
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Local AI Engine...</Text>
        <Text style={styles.loadingSub}>Qwen • On Device • No Server</Text>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {screen === 'chat' && (
        <ChatScreen
          aiCore={aiCore}
          conversation={conversation}
          onUpdateConversation={handleUpdateConversation}
          hasInternet={hasInternet}
          onOpenModels={() => setScreen('models')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'models' && (
        <ModelLibraryScreen
          aiCore={aiCore}
          onBack={() => setScreen('chat')}
          onModelChanged={() => setScreen('chat')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          aiCore={aiCore}
          settingsStore={settingsStore}
          onBack={() => setScreen('chat')}
        />
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.text,
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
