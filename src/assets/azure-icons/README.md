# Azure Architecture Icons

Drop official Microsoft Azure Architecture Icons here, named by **service id**
(matches `ServiceDef.id` in `src/lib/solution-blueprint/service-catalog.ts`).

```
src/assets/azure-icons/azure-foundry.svg
src/assets/azure-icons/azure-openai.svg
src/assets/azure-icons/azure-functions.svg
src/assets/azure-icons/...
```

The icon registry (`src/lib/diagram/azure-icons.ts`) auto-discovers these via
`import.meta.glob`. No code change is required — drop the SVG, rebuild, and the
`AzureIcon` component renders the bundled asset instead of the glyph fallback.

## Where to get them

Microsoft publishes the official **Azure architecture icons** package here:
https://learn.microsoft.com/en-us/azure/architecture/icons/

After downloading and accepting the [Microsoft Brand Guidelines][brand], rename
each SVG to its corresponding service id and copy it into this directory.

[brand]: https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks

## Service id ↔ icon mapping (current registry)

| Service id              | Suggested icon (Azure category)                  |
| ----------------------- | ------------------------------------------------ |
| `azure-foundry`         | AI + machine learning → Azure AI Foundry         |
| `azure-openai`          | AI + machine learning → Azure OpenAI Service     |
| `azure-content-safety`  | AI + machine learning → Content Safety           |
| `azure-doc-intel`       | AI + machine learning → AI Document Intelligence |
| `azure-speech`          | AI + machine learning → AI Speech                |
| `azure-app-service`     | Compute → App Services                           |
| `azure-container-apps`  | Compute → Container Apps                         |
| `azure-functions`       | Compute → Function Apps                          |
| `azure-aks`             | Containers → Kubernetes services                 |
| `azure-logic-apps`      | Integration → Logic Apps                         |
| `azure-event-hubs`      | Analytics → Event Hubs                           |
| `azure-service-bus`     | Integration → Service Bus                        |
| `azure-apim-ai-gateway` | Integration → API Management services            |
| `azure-sql`             | Databases → SQL Database                         |
| `azure-cosmos`          | Databases → Azure Cosmos DB                      |
| `azure-ai-search`       | AI + machine learning → AI Search                |
| `azure-fabric`          | Analytics → Microsoft Fabric                     |
| `azure-data-factory`    | Analytics → Data Factory                         |
| `azure-purview`         | Data Governance → Microsoft Purview              |
| `azure-storage`         | Storage → Storage Accounts                       |
| `azure-vnet`            | Networking → Virtual Networks                    |
| `azure-front-door`      | Networking → Front Door                          |
| `azure-monitor`         | Monitor → Azure Monitor                          |
| `entra-id`              | Identity → Microsoft Entra ID                    |
| `entra-external-id`     | Identity → Microsoft Entra External ID           |
| `entra-pim`             | Identity → Privileged Identity Management        |
| `azure-key-vault`       | Security → Key Vaults                            |
| `azure-ddos`            | Networking → DDoS Protection                     |
| `defender-cloud`        | Security → Microsoft Defender for Cloud          |
| `sentinel`              | Security → Microsoft Sentinel                    |
| `azure-cost-mgmt`       | General → Cost Management                        |
| `azure-quota`           | General → Quotas                                 |
| `azure-backup`          | Storage → Recovery Services Vaults               |

Files dropped here are bundled by Vite at build time; do not commit very large
PNGs. Prefer the official lightweight SVGs.
