"use client";

import { APIKeyManagement } from "@/components/api-key-management";
import { AIProviderAPIKeys } from "app-types/user";
import { fetcher } from "lib/utils";
import { useTranslations } from "next-intl";
import useSWR from "swr";

export function APIKeyManagementContent() {
  const _t = useTranslations();

  const { data: apiKeys, mutate } = useSWR<AIProviderAPIKeys>(
    "/api/user/api-keys",
    fetcher,
    {
      fallbackData: {},
      dedupingInterval: 60_000,
    },
  );

  const handleSaveApiKeys = async (newApiKeys: AIProviderAPIKeys) => {
    const response = await fetch("/api/user/api-keys", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newApiKeys),
    });

    if (!response.ok) {
      throw new Error("Failed to save API keys");
    }

    await mutate();
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold mb-2">API Key Management</h3>
      <p className="text-sm text-muted-foreground pb-6">
        Manage your API keys for different AI providers. These keys are stored
        securely and only used for your requests.
      </p>

      <APIKeyManagement initialApiKeys={apiKeys} onSave={handleSaveApiKeys} />
    </div>
  );
}
