"use client";

import { appStore } from "@/app/store";
import { useChatModelsWithUserKeys } from "@/hooks/queries/use-chat-models-with-user-keys";
import { ChatModel } from "app-types/chat";
import { cn, fetcher } from "lib/utils";
import { CheckIcon, ChevronDown, KeyIcon } from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";
import { APIKeyDialog } from "@/components/api-key-dialog";
import { toast } from "sonner";
import useSWR from "swr";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  currentModel?: ChatModel;
  showProvider?: boolean;
}

const providerNames = {
  openai: "OpenAI",
  google: "Google (Gemini)",
  anthropic: "Anthropic (Claude)",
  xai: "xAI (Grok)",
  groq: "Groq",
  openRouter: "OpenRouter",
  ollama: "Ollama",
} as const;

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const { data: providers, mutate } = useChatModelsWithUserKeys();
  const [model, setModel] = useState(props.currentModel);
  const { data: userApiKeys, mutate: mutateApiKeys } = useSWR(
    "/api/user/api-keys",
    fetcher,
  );

  const handleSaveApiKey = async (provider: string, apiKey: string) => {
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to save API key");
      }

      // Refresh API keys and models data
      mutateApiKeys();
      mutate();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {props.children || (
          <Button
            variant={"secondary"}
            size={"sm"}
            className="data-[state=open]:bg-input! hover:bg-input! "
            data-testid="model-selector-button"
          >
            <div className="mr-auto flex items-center gap-1">
              {(props.showProvider ?? true) && (
                <ModelProviderIcon
                  provider={model?.provider || ""}
                  className="size-2.5 mr-1"
                />
              )}
              <p data-testid="selected-model-name">{model?.model || "model"}</p>
            </div>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[280px]"
        align={props.align || "end"}
        data-testid="model-selector-popover"
      >
        <Command
          className="rounded-lg relative shadow-md h-80"
          value={JSON.stringify(model)}
          onClick={(e) => e.stopPropagation()}
        >
          <CommandInput
            placeholder="search model..."
            data-testid="model-search-input"
          />
          <CommandList className="p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {providers?.map((provider, i) => (
              <Fragment key={provider.provider}>
                <CommandGroup
                  heading={
                    <ProviderHeader
                      provider={provider.provider}
                      hasAPIKey={provider.hasAPIKey}
                      onAddApiKey={() => handleSaveApiKey}
                      userApiKeys={userApiKeys}
                    />
                  }
                  className={cn(
                    "pb-4 group",
                    !provider.hasAPIKey && "opacity-50",
                  )}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                  data-testid={`model-provider-${provider.provider}`}
                >
                  {provider.models.map((item) => (
                    <CommandItem
                      key={item.name}
                      disabled={!provider.hasAPIKey}
                      className="cursor-pointer"
                      onSelect={() => {
                        setModel({
                          provider: provider.provider,
                          model: item.name,
                        });
                        props.onSelect({
                          provider: provider.provider,
                          model: item.name,
                        });
                        setOpen(false);
                      }}
                      value={item.name}
                      data-testid={`model-option-${provider.provider}-${item.name}`}
                    >
                      {model?.provider === provider.provider &&
                      model?.model === item.name ? (
                        <CheckIcon
                          className="size-3"
                          data-testid="selected-model-check"
                        />
                      ) : (
                        <div className="ml-3" />
                      )}
                      <span className="pr-2">{item.name}</span>
                      {item.isToolCallUnsupported && (
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          No tools
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {i < providers?.length - 1 && <CommandSeparator />}
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
  hasAPIKey,
  onAddApiKey,
  userApiKeys,
}: {
  provider: string;
  hasAPIKey: boolean;
  onAddApiKey: (provider: string, apiKey: string) => Promise<void>;
  userApiKeys?: any;
}) {
  const providerName =
    providerNames[provider as keyof typeof providerNames] || provider;
  const currentApiKey = userApiKeys?.[provider] || "";

  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <ModelProviderIcon
          provider="openai"
          className="size-3 text-foreground"
        />
      ) : (
        <ModelProviderIcon provider={provider} className="size-3" />
      )}
      {providerName}
      {!hasAPIKey ? (
        <>
          <div className="ml-auto flex items-center gap-2">
            <APIKeyDialog
              provider={provider}
              providerName={providerName}
              currentApiKey={currentApiKey}
              onSave={onAddApiKey}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <KeyIcon className="h-3 w-3 mr-1" />
                Add Key
              </Button>
            </APIKeyDialog>
          </div>
        </>
      ) : (
        <div className="ml-auto flex items-center gap-2">
          <APIKeyDialog
            provider={provider}
            providerName={providerName}
            currentApiKey={currentApiKey}
            onSave={onAddApiKey}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <KeyIcon className="h-3 w-3" />
            </Button>
          </APIKeyDialog>
        </div>
      )}
    </div>
  );
});
