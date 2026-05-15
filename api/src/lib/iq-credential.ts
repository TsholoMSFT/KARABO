import { ClientSecretCredential, DefaultAzureCredential, type TokenCredential } from "@azure/identity";

/**
 * Shared credential + token helpers for the IQ family of connectors
 * (Microsoft Graph, Foundry IQ, Fabric IQ, Work IQ / Graph Connectors).
 *
 * Auth precedence:
 *   1. Service principal via env (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
 *   2. DefaultAzureCredential (managed identity, az login, etc.) when running on Azure
 */

let cachedCredential: TokenCredential | null | undefined;

export function isCredentialConfigured(): boolean {
  if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) return true;
  return Boolean(process.env.WEBSITE_INSTANCE_ID || process.env.FUNCTIONS_WORKER_RUNTIME);
}

export function getCredential(): TokenCredential | null {
  if (cachedCredential !== undefined) return cachedCredential;
  try {
    if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
      cachedCredential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET,
      );
    } else if (process.env.WEBSITE_INSTANCE_ID || process.env.FUNCTIONS_WORKER_RUNTIME) {
      cachedCredential = new DefaultAzureCredential();
    } else {
      cachedCredential = null;
    }
  } catch {
    cachedCredential = null;
  }
  return cachedCredential;
}

export async function getBearerToken(scope: string): Promise<string | null> {
  const cred = getCredential();
  if (!cred) return null;
  try {
    const tok = await cred.getToken(scope);
    return tok?.token ?? null;
  } catch {
    return null;
  }
}

export function notConfiguredBody(connector: string, requiredEnv: string[], docsUrl?: string) {
  return {
    configured: false,
    connector,
    message: `${connector} is not configured on this Azure Functions instance.`,
    requiredEnv,
    docsUrl,
  };
}

/**
 * Build auth headers for an Azure OpenAI / AI Foundry call.
 * Honours AZURE_OPENAI_AUTH_TYPE: "entra-id" (default) or "key".
 * Returns null when no auth method is configured.
 */
export async function getAoaiAuthHeaders(apiKey?: string): Promise<Record<string, string> | null> {
  const authType = (process.env.AZURE_OPENAI_AUTH_TYPE || "entra-id").toLowerCase();
  if (authType === "entra-id") {
    const token = await getBearerToken("https://cognitiveservices.azure.com/.default");
    if (token) return { Authorization: `Bearer ${token}` };
    // Fall back to key if available
    if (apiKey) return { "api-key": apiKey };
    return null;
  }
  if (apiKey) return { "api-key": apiKey };
  return null;
}
