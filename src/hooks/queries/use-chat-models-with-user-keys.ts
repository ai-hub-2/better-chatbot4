import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR from "swr";

export const useChatModelsWithUserKeys = () => {
  return useSWR<
    {
      provider: string;
      hasAPIKey: boolean;
      models: {
        name: string;
        isToolCallUnsupported: boolean;
      }[];
    }[]
  >("/api/chat/models-with-user-keys", fetcher, {
    dedupingInterval: 60_000, // Shorter interval since API keys can change more frequently
    revalidateOnFocus: false,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        const firstProviderWithKey = data.find((p) => p.hasAPIKey);
        if (firstProviderWithKey && firstProviderWithKey.models.length > 0) {
          const model = firstProviderWithKey.models[0].name;
          appStore.setState({
            chatModel: {
              provider: firstProviderWithKey.provider,
              model,
            },
          });
        }
      }
    },
  });
};
