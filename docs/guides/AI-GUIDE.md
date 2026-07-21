# AI Integration Summary

**Author:** Tsholo K. Setati  
**Project:** ID-8 (Microsoft Innovation Hub Enterprise Discovery)

## What's New? 🤖✨

I've added powerful AI capabilities to the ID-8 (Microsoft Innovation Hub Use Case Assessment) tool to make the discovery process smarter, faster, and more insightful.

## Key AI Features

### 1. 💡 Smart Question Assistance (Standard Discovery)
**What it does**: Helps you think through complex discovery questions
**How to use**: Click the "Need help?" button next to any question
**Result**: Get thoughtful prompts and examples tailored to your industry and context

### 2. 🎯 Real-Time Discovery Insights (Live Discovery)
**What it does**: Analyzes your voice responses in real-time
**How to use**: Click "Get AI Insight" after answering a question
**Result**: Receive immediate analysis highlighting opportunities and suggesting areas to explore

### 3. 🚀 Automatic Use Case Generation
**What it does**: Generates 5-8 relevant, evidence-backed candidates based on your discovery session
**How to use**: Happens automatically at the end of discovery
**Result**: Lean candidates with business outcomes, KPIs, process context, risk, and complexity. Detailed Microsoft solution mapping is intentionally deferred until after scoring.

### 4. 🏗️ Post-Ranking Solution Mapping
**What it does**: Maps the top-ranked use case to Microsoft products, services, a reference architecture, implementation complexity, compliance, security, and an optional agentic pattern
**How to use**: Complete Impact/Feasibility and RICE scoring, then select **Solution Design**
**Result**: The ranked use case is saved with mapping provenance and opens as the linked seed in Solution Blueprint. If AI mapping is unavailable, deterministic archetype inference still opens the workspace.

### 5. 📄 Professional Executive Summaries
**What it does**: Creates executive-ready summaries of your discovery sessions
**How to use**: Generated automatically after scoring all use cases
**Result**: 3-4 paragraph summary covering key findings, recommendations with scores, and strategic next steps

## AI Model Information

The application uses task-specific model routing and bounded output budgets:

- **Development**: Foundry Local first when explicitly enabled, then Azure OpenAI if the local service is unavailable or returns an invalid response.
- **Production**: Azure OpenAI only, followed by the typed deterministic fallback owned by each feature.
- **Embeddings**: `text-embedding-3-small` with 1536 dimensions.
- **Images**: `gpt-image-1-mini` with low-cost quality defaults.

The API exposes separate liveness and readiness checks:

- `/api/health` confirms that the Functions host is serving requests.
- `/api/ai-readiness` sends a minimal cached request to the configured model deployment and classifies configuration, authentication, disabled-subscription, deployment, throttling, and timeout failures.

Use-case candidates and ranked solution mappings are validated against bounded schemas. Permanent provider failures are not retried; the application automatically switches candidate generation to clearly labelled industry templates.

## Azure Authentication

Set `AZURE_OPENAI_AUTH_TYPE` explicitly in every environment:

- `key` (default deployment mode): uses `AZURE_OPENAI_API_KEY`, normally supplied through a Key Vault reference.
- `entra-id`: uses the developer identity locally and the Function App managed identity in Azure. The identity requires **Cognitive Services OpenAI User** on the existing AI Services/OpenAI account.

The two modes are strict. An Entra failure does not silently cross over to a configured key.

## Foundry Local Development Setup

Prerequisites are Windows, Node.js 20 or later, and enough disk space for the selected model and execution provider. The root development dependencies include the official `foundry-local-sdk-winml` package; they are not part of the Azure Functions package.

1. List aliases available for this device with `npm run foundry:models`.
2. Start and, on first use, download the configured model with `npm run foundry:local -- --model=<alias>`.
3. Set `FOUNDRY_LOCAL_ENABLED` to `true` in `api/local.settings.json` and keep `FOUNDRY_LOCAL_ENDPOINT` on an HTTP loopback address.
4. Start Azure Functions and the frontend/SWA emulator normally.

The default alias is `phi-4-mini-instruct`; use an alias from `foundry:models` if it is unavailable on this machine. Model acquisition happens only during the explicit Foundry Local startup command, never during `/api/chat`. Press Ctrl+C to unload the model and stop the local service.

Local requests stay on-device. If local inference times out, fails, or produces malformed JSON for a JSON task, the same task content is sent to Azure OpenAI as the configured development fallback. Production ignores all Foundry Local settings.

## Where to See AI in Action

1. **Live Discovery Mode**: Look for the "Get AI Insight" button after answering questions
2. **Standard Discovery Mode**: Click "Need help?" next to any question
3. **Discovery Results Screen**: Watch AI generate use cases automatically
4. **Executive Summary Section**: See AI-generated summaries on your dashboard with sparkle icon

## Privacy & Data

- AI only sees information you explicitly provide in the discovery process
- All AI-generated content is stored locally in your browser
- No personal authentication data is sent to AI services
- You maintain full control over all generated content

## Tips for Best Results

From my experience, here's what works best:

✅ **Provide detailed answers**: More context leads to better AI suggestions
✅ **Use AI help when stuck**: Don't hesitate to request insights or suggestions
✅ **Review AI suggestions**: AI recommendations are starting points - customize as needed
✅ **Include industry specifics**: Mention specific technologies, processes, or challenges

## Troubleshooting

**"Failed to generate insight"**: Click the button again to retry, or continue without AI assistance

**Use case generation takes a while**: This is normal - analyzing comprehensive responses takes 5-15 seconds

**Live Discovery not working**: Make sure you're using Chrome, Edge, or Safari for speech recognition

---

**Need More Help?**
See [AI-FEATURES.md](./AI-FEATURES.md) for complete technical documentation
