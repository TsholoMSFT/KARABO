/**
 * Creates the `karabo-knowledge` index in Azure AI Search.
 * Run with: cmd /c "C:\Program Files\nodejs\npx.cmd tsx scripts/create-search-index.ts"
 *
 * Required env (load from .env or local.settings.json values):
 *   AZURE_SEARCH_ENDPOINT  e.g. https://id8-search.search.windows.net
 *   AZURE_SEARCH_KEY       admin key
 *   AZURE_SEARCH_INDEX     defaults to karabo-knowledge
 */
import { AzureKeyCredential, SearchIndexClient, SearchIndex } from '@azure/search-documents'

const endpoint = process.env.AZURE_SEARCH_ENDPOINT
const key = process.env.AZURE_SEARCH_KEY
const indexName = process.env.AZURE_SEARCH_INDEX || 'karabo-knowledge'

if (!endpoint || !key) {
  console.error('AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY must be set.')
  process.exit(1)
}

const client = new SearchIndexClient(endpoint, new AzureKeyCredential(key))

const index: SearchIndex = {
  name: indexName,
  fields: [
    { name: 'id', type: 'Edm.String', key: true, filterable: true },
    { name: 'title', type: 'Edm.String', searchable: true },
    { name: 'content', type: 'Edm.String', searchable: true },
    { name: 'source', type: 'Edm.String', filterable: true, facetable: true },
    { name: 'category', type: 'Edm.String', filterable: true, facetable: true },
    { name: 'url', type: 'Edm.String' },
    {
      name: 'embedding',
      type: 'Collection(Edm.Single)',
      searchable: true,
      vectorSearchDimensions: 3072,
      vectorSearchProfileName: 'karabo-vector-profile',
    },
  ],
  vectorSearch: {
    algorithms: [{ name: 'karabo-hnsw', kind: 'hnsw' }],
    profiles: [{ name: 'karabo-vector-profile', algorithmConfigurationName: 'karabo-hnsw' }],
  },
  semanticSearch: {
    configurations: [
      {
        name: 'karabo-semantic',
        prioritizedFields: {
          titleField: { name: 'title' },
          contentFields: [{ name: 'content' }],
          keywordsFields: [{ name: 'category' }],
        },
      },
    ],
  },
}

;(async () => {
  try {
    await client.getIndex(indexName)
    console.log(`Index ${indexName} exists — updating.`)
    await client.createOrUpdateIndex(index)
  } catch {
    console.log(`Creating index ${indexName}.`)
    await client.createIndex(index)
  }
  console.log('Done.')
})().catch((e) => {
  console.error('Failed:', e)
  process.exit(1)
})
