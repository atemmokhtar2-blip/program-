/**
 * Chat Screen – الشاشة الرئيسية حسب المواصفات القسم 16
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from './theme';
import { Message, TaskState } from '../types';
import { AICore } from '../ai-core/AICore';
import { Conversation } from '../types';

interface Props {
  aiCore: AICore;
  conversation: Conversation;
  onUpdateConversation: (c: Conversation) => void;
  hasInternet: boolean;
  onOpenModels: () => void;
  onOpenSettings: () => void;
}

export function ChatScreen({
  aiCore,
  conversation,
  onUpdateConversation,
  hasInternet,
  onOpenModels,
  onOpenSettings,
}: Props) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskState, setTaskState] = useState<TaskState>('IDLE');
  const [streamingText, setStreamingText] = useState('');
  const listRef = useRef<FlatList>(null);

  const activeModel = aiCore.modelManager.getActiveModel();

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    setInput('');
    setIsGenerating(true);
    setStreamingText('');
    setTaskState('ANALYZING');

    // إضافة رسالة المستخدم
    const userMsg = aiCore.context.createMessage('user', text);
    const updated: Conversation = {
      ...conversation,
      messages: [...conversation.messages, userMsg],
      updatedAt: Date.now(),
    };
    onUpdateConversation(updated);

    try {
      const { message, task } = await aiCore.processUserMessage(
        updated,
        text,
        hasInternet,
        (token) => {
          setStreamingText((prev) => prev + token);
        },
        (state) => setTaskState(state)
      );

      const finalConv: Conversation = {
        ...updated,
        messages: [...updated.messages, message],
        updatedAt: Date.now(),
      };
      onUpdateConversation(finalConv);
      setStreamingText('');
    } catch (e) {
      // handled inside AICore
    } finally {
      setIsGenerating(false);
      setTaskState('IDLE');
    }
  };

  const handleStop = () => {
    aiCore.stopGeneration();
    setIsGenerating(false);
    setTaskState('CANCELLED');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.msgText}>{item.content}</Text>
        {!isUser && item.modelId && (
          <Text style={styles.msgMeta}>
            {item.modelId === 'qwen-local-bundled' ? 'Qwen Local • On Device' : item.modelId}
            {item.confidence ? ` • ${item.confidence}` : ''}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Local AI</Text>
          <Text style={styles.modelStatus}>
            {activeModel?.name || 'Qwen Local'} •{' '}
            <Text style={{ color: colors.local }}>● Running locally</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onOpenModels} style={styles.iconBtn}>
            <Text style={styles.iconText}>Models</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {hasInternet ? 'Online tools available' : 'Offline • Local only'} • {taskState}
        </Text>
      </View>

      {/* Chat Area */}
      <FlatList
        ref={listRef}
        data={conversation.messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          streamingText ? (
            <View style={[styles.msgBubble, styles.aiBubble]}>
              <Text style={styles.msgText}>{streamingText}</Text>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
            </View>
          ) : null
        }
      />

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!isGenerating}
        />
        <View style={styles.composerActions}>
          {isGenerating ? (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { color: colors.text, fontSize: 20, fontWeight: '700' },
  modelStatus: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  iconText: { color: colors.text, fontSize: 13 },
  statusBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  statusText: { color: colors.textMuted, fontSize: 11 },
  chatList: { padding: spacing.md, paddingBottom: 24 },
  msgBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  msgMeta: { color: colors.textMuted, fontSize: 10, marginTop: 6 },
  composer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontWeight: '600' },
  stopBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopText: { color: '#fff', fontWeight: '600' },
});
