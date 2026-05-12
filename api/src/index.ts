// Main entry point for Azure Functions v4
// This file imports all function handlers to register them with the runtime

// Polyfill for crypto in Azure Static Web Apps managed functions
// The @azure/storage-blob SDK requires crypto which may not be globally available
import * as crypto from "crypto";
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = crypto;
}

import "./functions/chat";
import "./functions/earnings";
import "./functions/health";
import "./functions/rss-feeds";
import "./functions/regulatory-feeds";
import "./functions/ocr";
import "./functions/learn-search";
import "./functions/learn-fetch";
import "./functions/embeddings";
import "./functions/search-knowledge";
import "./functions/exchange-rates";
import "./functions/economic-data";
import "./functions/company-financials";
