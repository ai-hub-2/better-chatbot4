import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import { ChatModel } from "app-types/chat";
import { AIProviderAPIKeys } from "app-types/user";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";

// Model definitions remain the same
const modelDefinitions = {
  openai: {
    "gpt-4.1": "gpt-4.1",
    "gpt-4.1-mini": "gpt-4.1-mini",
    "o4-mini": "o4-mini",
    o3: "o3",
    "gpt-5": "gpt-5",
    "gpt-5-mini": "gpt-5-mini",
    "gpt-5-nano": "gpt-5-nano",
  },
  google: {
    "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
  },
  anthropic: {
    "claude-4-sonnet": "claude-4-sonnet-20250514",
    "claude-4-opus": "claude-4-opus-20250514",
    "claude-3-7-sonnet": "claude-3-7-sonnet-20250219",
  },
  xai: {
    "grok-4": "grok-4",
    "grok-3": "grok-3",
    "grok-3-mini": "grok-3-mini",
  },
  ollama: {
    "gemma3:1b": "gemma3:1b",
    "gemma3:4b": "gemma3:4b",
    "gemma3:12b": "gemma3:12b",
  },
  groq: {
    "kimi-k2-instruct": "moonshotai/kimi-k2-instruct",
    "llama-4-scout-17b": "meta-llama/llama-4-scout-17b-16e-instruct",
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "qwen3-32b": "qwen/qwen3-32b",
  },
  openRouter: {
    "gpt-oss-20b:free": "openai/gpt-oss-20b:free",
    "qwen3-8b:free": "qwen/qwen3-8b:free",
    "qwen3-14b:free": "qwen/qwen3-14b:free",
    "qwen3-coder:free": "qwen/qwen3-coder:free",
    "deepseek-r1:free": "deepseek/deepseek-r1-0528:free",
    "deepseek-v3:free": "deepseek/deepseek-chat-v3-0324:free",
    "gemini-2.0-flash-exp:free": "google/gemini-2.0-flash-exp:free",
  },
};

const unsupportedModelNames = new Set([
  "o4-mini",
  "gemma3:1b",
  "gemma3:4b",
  "gemma3:12b",
  "gpt-oss-20b:free",
  "qwen3-8b:free",
  "qwen3-14b:free",
  "deepseek-r1:free",
  "gemini-2.0-flash-exp:free",
]);

export function createDynamicModelProvider(userApiKeys?: AIProviderAPIKeys) {
  // Combine environment and user API keys, with user keys taking precedence
  const effectiveApiKeys = {
    openai: userApiKeys?.openai || process.env.OPENAI_API_KEY,
    google: userApiKeys?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    anthropic: userApiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
    xai: userApiKeys?.xai || process.env.XAI_API_KEY,
    groq: userApiKeys?.groq || process.env.GROQ_API_KEY,
    openrouter: userApiKeys?.openrouter || process.env.OPENROUTER_API_KEY,
    ollama: userApiKeys?.ollama || process.env.OLLAMA_API_KEY,
  };

  // Create provider instances with effective API keys
  const providers = {
    openai: effectiveApiKeys.openai
      ? openai.provider({ apiKey: effectiveApiKeys.openai })
      : null,
    google: effectiveApiKeys.google
      ? google.provider({ apiKey: effectiveApiKeys.google })
      : null,
    anthropic: effectiveApiKeys.anthropic
      ? anthropic.provider({ apiKey: effectiveApiKeys.anthropic })
      : null,
    xai: effectiveApiKeys.xai
      ? xai.provider({ apiKey: effectiveApiKeys.xai })
      : null,
    groq: effectiveApiKeys.groq
      ? createGroq({
          baseURL:
            process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
          apiKey: effectiveApiKeys.groq,
        })
      : null,
    openrouter: effectiveApiKeys.openrouter
      ? openrouter.provider({
          apiKey: effectiveApiKeys.openrouter,
        })
      : null,
    ollama: createOllama({
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
    }),
  };

  // Create models dynamically
  const models: Record<string, Record<string, LanguageModel>> = {};

  Object.entries(modelDefinitions).forEach(([providerName, modelDefs]) => {
    const provider = providers[providerName as keyof typeof providers];
    if (provider) {
      models[providerName] = {};
      Object.entries(modelDefs).forEach(([modelName, modelId]) => {
        if (providerName === "ollama") {
          models[providerName][modelName] = (providers.ollama as any)(modelId);
        } else {
          models[providerName][modelName] = (provider as any)(modelId);
        }
      });
    }
  });

  // Get modelsInfo with API key status
  const modelsInfo = Object.entries(modelDefinitions).map(
    ([provider, modelDefs]) => ({
      provider,
      models: Object.entries(modelDefs).map(([name]) => ({
        name,
        isToolCallUnsupported: unsupportedModelNames.has(name),
      })),
      hasAPIKey: checkProviderAPIKey(
        provider as keyof typeof effectiveApiKeys,
        effectiveApiKeys,
      ),
    }),
  );

  const fallbackModel = models.openai?.["gpt-4.1"];

  return {
    modelsInfo,
    getModel: (model?: ChatModel): LanguageModel => {
      if (!model) return fallbackModel;
      return models[model.provider]?.[model.model] || fallbackModel;
    },
    hasProviderAPIKey: (provider: string) =>
      checkProviderAPIKey(
        provider as keyof typeof effectiveApiKeys,
        effectiveApiKeys,
      ),
  };
}

function checkProviderAPIKey(
  provider: keyof typeof modelDefinitions,
  apiKeys: Record<string, string | undefined>,
) {
  let key: string | undefined;
  switch (provider) {
    case "openai":
      key = apiKeys.openai;
      break;
    case "google":
      key = apiKeys.google;
      break;
    case "anthropic":
      key = apiKeys.anthropic;
      break;
    case "xai":
      key = apiKeys.xai;
      break;
    case "ollama":
      return true; // Ollama doesn't typically need an API key
    case "groq":
      key = apiKeys.groq;
      break;
    case "openRouter":
      key = apiKeys.openrouter;
      break;
    default:
      return false;
  }
  return !!key && key !== "****";
}

// Helper function to get effective API keys for a user
export function getEffectiveApiKeys(userApiKeys?: AIProviderAPIKeys) {
  return {
    openai: userApiKeys?.openai || process.env.OPENAI_API_KEY,
    google: userApiKeys?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    anthropic: userApiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
    xai: userApiKeys?.xai || process.env.XAI_API_KEY,
    groq: userApiKeys?.groq || process.env.GROQ_API_KEY,
    openrouter: userApiKeys?.openrouter || process.env.OPENROUTER_API_KEY,
    ollama: userApiKeys?.ollama || process.env.OLLAMA_API_KEY,
  };
}
