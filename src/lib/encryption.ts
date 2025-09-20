// Simple API key handling - can be enhanced with proper encryption later
export function encryptApiKey(apiKey: string): string {
  return apiKey; // For now, store as-is. TODO: Add proper encryption
}

export function decryptApiKey(encryptedApiKey: string): string {
  return encryptedApiKey; // For now, return as-is. TODO: Add proper decryption
}

export function encryptApiKeys(
  apiKeys: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return apiKeys; // TODO: Implement proper encryption
}

export function decryptApiKeys(
  encryptedApiKeys: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return encryptedApiKeys || {}; // TODO: Implement proper decryption
}
