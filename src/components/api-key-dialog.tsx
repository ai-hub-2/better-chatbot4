"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { EyeIcon, EyeOffIcon, KeyIcon, SettingsIcon } from "lucide-react";
import { ModelProviderIcon } from "@/components/ui/model-provider-icon";
import { AIProviderAPIKeys } from "app-types/user";
import { toast } from "sonner";

interface APIKeyDialogProps {
  provider: string;
  providerName: string;
  currentApiKey?: string;
  onSave: (provider: string, apiKey: string) => Promise<void>;
  children?: React.ReactNode;
}

export function APIKeyDialog({
  provider,
  providerName,
  currentApiKey = "",
  onSave,
  children,
}: APIKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey(currentApiKey);
    }
  }, [open, currentApiKey]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(provider, apiKey);
      toast.success(`${providerName} API key saved successfully!`);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save API key. Please try again.");
      console.error("Error saving API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = apiKey !== currentApiKey;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <KeyIcon className="h-3 w-3 mr-1" />
            Add Key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ModelProviderIcon provider={provider} className="h-5 w-5" />
            {providerName} API Key
          </DialogTitle>
          <DialogDescription>
            Enter your {providerName} API key to enable this provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                placeholder={`Enter your ${providerName} API key...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {provider === "ollama" && (
            <p className="text-xs text-muted-foreground">
              For Ollama running locally, you typically don&apos;t need an API
              key.
            </p>
          )}

          {provider === "openai" && (
            <p className="text-xs text-muted-foreground">
              Get your OpenAI API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          )}

          {provider === "anthropic" && (
            <p className="text-xs text-muted-foreground">
              Get your Anthropic API key from{" "}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          )}

          {provider === "google" && (
            <p className="text-xs text-muted-foreground">
              Get your Google AI API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                aistudio.google.com/app/apikey
              </a>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading || !apiKey.trim()}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
