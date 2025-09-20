import { getSession } from "auth/server";
import { AIProviderAPIKeysZodSchema, AIProviderAPIKeys } from "app-types/user";
import { userRepository } from "lib/db/repository";
import { encryptApiKeys, decryptApiKeys } from "lib/encryption";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await userRepository.getPreferences(session.user.id);
    const encryptedApiKeys = preferences?.apiKeys ?? {};

    // Decrypt API keys before sending to client
    const decryptedApiKeys = decryptApiKeys(encryptedApiKeys);

    return NextResponse.json(decryptedApiKeys);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get API keys" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const apiKeys = AIProviderAPIKeysZodSchema.parse(json);

    // Encrypt API keys before storing
    const encryptedApiKeys = encryptApiKeys(apiKeys);

    // Get current preferences
    const currentPreferences = await userRepository.getPreferences(
      session.user.id,
    );

    // Update only the API keys part
    const updatedPreferences = {
      ...currentPreferences,
      apiKeys: encryptedApiKeys,
    };

    const updatedUser = await userRepository.updatePreferences(
      session.user.id,
      updatedPreferences,
    );

    return NextResponse.json({
      success: true,
      apiKeys: updatedUser.preferences?.apiKeys,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update API keys" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { provider, apiKey } = json;

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      );
    }

    // Get current preferences
    const currentPreferences = await userRepository.getPreferences(
      session.user.id,
    );

    // Decrypt current API keys, update specific provider, then re-encrypt
    const currentDecryptedKeys = decryptApiKeys(
      currentPreferences?.apiKeys || {},
    );
    const updatedDecryptedKeys = {
      ...currentDecryptedKeys,
      [provider]: apiKey || undefined,
    };
    const encryptedApiKeys = encryptApiKeys(updatedDecryptedKeys);

    const updatedPreferences = {
      ...currentPreferences,
      apiKeys: encryptedApiKeys,
    };

    const updatedUser = await userRepository.updatePreferences(
      session.user.id,
      updatedPreferences,
    );

    return NextResponse.json({
      success: true,
      apiKeys: updatedUser.preferences?.apiKeys,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update API key" },
      { status: 500 },
    );
  }
}
