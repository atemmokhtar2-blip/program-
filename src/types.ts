/**
 * Core Types – Local AI Application
 * Strict adherence to executive specifications
 */

export type DeviceCapability = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export type ModelStatus = 'not_installed' | 'downloading' | 'installed' | 'loading' | 'running' | 'error';

export type TaskState =
  | 'IDLE'
  | 'ANALYZING'
  | 'RUNNING'
  | 'WAITING_FOR_TOOL'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type Quantization = 'Q2_K' | 'Q3_K' | 'Q4_0' | 'Q4_K_M' | 'Q5_K_M' | 'Q6_K' | 'Q8_0' | 'FP16' | 'unknown';

export interface DeviceInfo {
  ramGB: number;
  cpuCores: number;
  architecture: string;
  availableStorageGB: number;
  hasGpuAcceleration: boolean;
  os: string;
  osVersion: string;
  capability: DeviceCapability;
}

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  sizeBytes: number;
  quantization: Quantization;
  ramRequirementGB: number;
  capabilities: string[];
  status: ModelStatus;
  isBundled: boolean; // true for the built-in Qwen
  downloadProgress?: number; // 0-1
  localPath?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  confidence?: ConfidenceLevel;
  modelId?: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelId: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
}

export interface Task {
  id: string;
  state: TaskState;
  userRequest: string;
  analysis?: TaskAnalysis;
  result?: string;
  error?: string;
  confidence?: ConfidenceLevel;
  usedTools: string[];
  startedAt: number;
  finishedAt?: number;
}

export interface TaskAnalysis {
  needsLiveData: boolean;
  suggestedRoute: 'LOCAL_AI' | 'INTERNET_TOOL' | 'HYBRID';
  requiredTools: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface AIRouterDecision {
  route: 'LOCAL_AI' | 'INTERNET_TOOL' | 'HYBRID';
  modelId?: string;
  tools: string[];
  reason: string;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export interface GenerationResult {
  text: string;
  confidence: ConfidenceLevel;
  finishReason: 'stop' | 'length' | 'cancelled' | 'error';
  tokensGenerated: number;
}
