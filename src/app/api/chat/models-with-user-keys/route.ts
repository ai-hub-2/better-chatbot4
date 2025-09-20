import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { userRepository } from "lib/db/repository";
import { createDynamicModelProvider } from "@/lib/ai/dynamic-models";

export async function GET() {
  try {
    const session = await getSession();

    let userApiKeys;
    if (session?.user?.id) {
      const preferences = await userRepository.getPreferences(session.user.id);
      userApiKeys = preferences?.apiKeys;
    }

    const modelProvider = createDynamicModelProvider(userApiKeys);

    return NextResponse.json(modelProvider.modelsInfo);
  } catch (error) {
    console.error("Error fetching models with user keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}
