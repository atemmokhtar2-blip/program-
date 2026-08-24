# Architecture Documentation

## Strict Local-First Design

### Forbidden Architecture
```
User → Internet → Our Server → AI Model
```

### Required Architecture
```
┌─────────────────────┐
│     تطبيق المستخدم   │
└──────────┬──────────┘
           │
┌──────────┴──────────┐
│                     │
Local AI Engine   Internet Tools
│                     │
Local Qwen Model  Search / Web / APIs
│                     │
Device Storage        │
│                     │
└──────────┬──────────┘
           │
    Unified AI UI
```

## Component Responsibilities

| Layer | Responsibility |
|-------|----------------|
| UI | Dark premium interface, streaming, stop generation |
| Model Runtime | Load/unload, inference, streaming, cancellation |
| Model Manager | Discover, download, verify, delete models, device capability |
| AI Router | Decide LOCAL_AI vs INTERNET_TOOL, anti-hallucination routing |
| Context Manager | Conversation history, prompt building |
| Tools | Independent tools (Search, Browser, Files...) – model never pretends |
| Storage | Local only (conversations, models, settings) |
| Network | Connectivity detection, downloads, external APIs |

## Task State Machine

```
IDLE → ANALYZING → RUNNING → (WAITING_FOR_TOOL) → PROCESSING → COMPLETED
                                                              → FAILED
                                                              → CANCELLED
```

No silent transitions. No fake success.

## Anti-Hallucination Rules (enforced in prompts + router)

1. Never invent unknown information as fact
2. Say "I'm not sure" when insufficient knowledge
3. Time-sensitive data is untrusted without live source
4. Never invent sources / links / search results
5. Never claim tool use that didn't happen
6. Never claim file read that didn't happen
7. Show conflicts instead of random choice
