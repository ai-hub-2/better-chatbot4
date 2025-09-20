"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, SaveIcon, KeyIcon } from "lucide-react";
import { ModelProviderIcon } from "@/components/ui/model-provider-icon";
import { AIProviderAPIKeys } from "app-types/user";
import { toast } from "sonner";

interface APIKeyManagementProps {
  initialApiKeys?: AIProviderAPIKeys;
  onSave: (apiKeys: AIProviderAPIKeys) => Promise<void>;
}

const providerLabels = {
  openai: "OpenAI",
  google: "Google (Gemini)",
  anthropic: "Anthropic (Claude)",
  xai: "xAI (Grok)",
  groq: "Groq",
  openrouter: "OpenRouter",
  ollama: "Ollama",
} as const;

export function APIKeyManagement({
  initialApiKeys = {},
  onSave,
}: APIKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<AIProviderAPIKeys>(initialApiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setApiKeys(initialApiKeys);
  }, [initialApiKeys]);

  const handleKeyChange = (
    provider: keyof AIProviderAPIKeys,
    value: string,
  ) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value || undefined,
    }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(apiKeys);
      toast.success("API keys saved successfully!");
    } catch (error) {
      toast.error("Failed to save API keys. Please try again.");
      console.error("Error saving API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = JSON.stringify(apiKeys) !== JSON.stringify(initialApiKeys);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Add your API keys for different AI providers. These keys are stored
          securely and only used to make requests on your behalf.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(providerLabels).map(([provider, label]) => (
          <div key={provider} className="space-y-2">
            <Label htmlFor={provider} className="flex items-center gap-2">
              <ModelProviderIcon provider={provider} className="h-4 w-4" />
              {label}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={provider}
                  type={showKeys[provider] ? "text" : "password"}
                  placeholder={`Enter your ${label} API key...`}
                  value={apiKeys[provider as keyof AIProviderAPIKeys] || ""}
                  onChange={(e) =>
                    handleKeyChange(
                      provider as keyof AIProviderAPIKeys,
                      e.target.value,
                    )
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => toggleShowKey(provider)}
                  tabIndex={-1}
                >
                  {showKeys[provider] ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {provider === "ollama" && (
              <p className="text-xs text-muted-foreground">
                For Ollama, you typically don&apos;t need an API key if running
                locally.
              </p>
            )}
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="w-full"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save API Keys"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
