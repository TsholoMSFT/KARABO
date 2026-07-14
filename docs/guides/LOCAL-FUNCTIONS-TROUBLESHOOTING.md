# Local Azure Functions Troubleshooting (KARABO)

This repo uses Azure Functions Core Tools (v4) for the backend under `api/`.

## Symptom: routes print, but `localhost:<port>` is not reachable

If `func start` prints routes like `http://localhost:7071/api/chat` but:
- `curl http://localhost:7071/api/chat` fails, and/or
- `Test-NetConnection localhost -Port 7071` fails, and/or
- `netstat -ano | findstr :7071` shows **no LISTENING socket**

…it usually means the Functions host process is not actually staying alive, or it is failing before the HTTP listener is bound.

### 1) Verify the process is still running

- Start in the foreground to watch for shutdown messages:
  - `cd api`
  - `func start --verbose --port 7071`

If it exits immediately, scroll up for the first error.

### 2) Ensure storage is configured (recommended)

Even for HTTP-only projects, local host stability is best when storage is set.

- Install and start Azurite (recommended for local dev)
- Set in `api/local.settings.json`:
  - `AzureWebJobsStorage` = `UseDevelopmentStorage=true`

### 3) Eliminate port conflicts + loopback quirks

- Try a different port:
  - `func start --verbose --port 7075`
- Try using IPv4 explicitly:
  - `curl http://127.0.0.1:7071/api/rss-feeds`

### 4) Check environment and runtime prerequisites

- Azure Functions Core Tools v4 installed: `func --version`
- Node version supported by your Core Tools install
- If you’re in a corporate environment:
  - VPN / endpoint security can interfere with local listeners
  - Temporarily disable VPN and re-test

### 5) Verify the API is reachable from the frontend

The frontend calls `/api/*`.

- If you are running Vite separately, confirm any proxy config (or Static Web Apps emulator) is routing `/api` to the Functions host.

## RSS storage configuration

The RSS endpoint reads from Azure Blob Storage container `rss-feeds`.

The backend accepts either of these env vars:
- `AZURE_STORAGE_CONNECTION_STRING` (preferred)
- `AzureWebJobsStorage` (fallback)

If RSS returns an empty list with a message about configuration, set one of those.

## Foundry Local routing

`/api/health` reports safe Foundry Local metadata under `foundryLocal`: whether a loopback endpoint is configured, whether local routing is enabled for this runtime, and the selected model alias.

- A non-loopback or HTTPS `FOUNDRY_LOCAL_ENDPOINT` is rejected.
- `NODE_ENV=production` or `AZURE_FUNCTIONS_ENVIRONMENT=production` disables local routing even if the enable flag is set.
- A stopped local service should add only the configured timeout before `/api/chat` falls through to Azure OpenAI. Lower `FOUNDRY_LOCAL_TIMEOUT_MS` if this delay is too long.
- Run `npm run foundry:models` from the repository root if the configured alias is not present in the local catalog.
