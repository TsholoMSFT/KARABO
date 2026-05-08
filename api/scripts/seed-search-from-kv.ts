/**
 * Convenience wrapper: pulls the search + AOAI secrets from karabo-keyvault
 * via DefaultAzureCredential (VS Code / azd login), then invokes the seeder
 * in-process. Avoids ever copy-pasting secrets to your shell.
 *
 * Run: cd api && npx tsx scripts/seed-search-from-kv.ts
 */
import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'

const VAULT_URL = process.env.KARABO_KV_URL || 'https://karabo-keyvault.vault.azure.net/'
const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT || 'https://id8-search.search.windows.net'
const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://karabo-openai.openai.azure.com/'

async function main() {
  console.log(`Authenticating to ${VAULT_URL} via DefaultAzureCredential…`)
  const credential = new DefaultAzureCredential()
  const kv = new SecretClient(VAULT_URL, credential)

  console.log('Fetching secrets: azure-search-admin-key, ai-hub-api-key, ai-hub-endpoint…')
  const [searchSecret, aoaiKeySecret, aoaiEndpointSecret] = await Promise.all([
    kv.getSecret('azure-search-admin-key'),
    kv.getSecret('ai-hub-api-key'),
    kv.getSecret('ai-hub-endpoint'),
  ])

  if (!searchSecret.value || !aoaiKeySecret.value || !aoaiEndpointSecret.value) {
    throw new Error('Key Vault returned empty secret values')
  }

  process.env.AZURE_SEARCH_ENDPOINT = SEARCH_ENDPOINT
  process.env.AZURE_SEARCH_KEY = searchSecret.value
  process.env.AZURE_OPENAI_ENDPOINT = aoaiEndpointSecret.value
  process.env.AZURE_OPENAI_API_KEY = aoaiKeySecret.value

  console.log('Secrets loaded. Invoking seeder…\n')
  await import('./seed-search')
}

main().catch((e) => {
  console.error('Wrapper failed:', e?.message ?? e)
  if (e?.code === 'AccessDenied' || /forbidden/i.test(String(e?.message))) {
    console.error('\nHint: your account needs the "Key Vault Secrets User" role on karabo-keyvault.')
  }
  process.exit(1)
})
