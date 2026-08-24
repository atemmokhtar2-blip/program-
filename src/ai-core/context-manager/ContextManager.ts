/**
 * Context Manager
 * إدارة سياق المحادثة والرسائل
 */

import { Message, Conversation } from '../../types';

export class ContextManager {
  private maxContextMessages = 20; // للحفاظ على الذاكرة

  buildPrompt(
    conversation: Conversation,
    newUserMessage: string
  ): { system: string; messages: { role: string; content: string }[] } {
    const system = `أنت مساعد ذكاء اصطناعي محلي يعمل على جهاز المستخدم.
الاسم: Qwen Local
القواعد:
- لا تختلق معلومات.
- إذا لم تكن متأكدًا قل ذلك.
- لا تختلق أسعار أو أخبار أو بيانات حية.
- كن مفيدًا ودقيقًا.`;

    const history = conversation.messages
      .slice(-this.maxContextMessages)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    history.push({ role: 'user', content: newUserMessage });

    return { system, messages: history };
  }

  createMessage(
    role: Message['role'],
    content: string,
    modelId?: string,
    confidence?: Message['confidence']
  ): Message {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      modelId,
      confidence,
    };
  }

  createConversation(title: string, modelId: string): Conversation {
    return {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: title || 'محادثة جديدة',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId,
    };
  }
}
