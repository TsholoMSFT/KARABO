targetScope = 'resourceGroup'

@description('Environment name (azd). Used as a suffix for resource names.')
param environmentName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Existing Key Vault name that holds AOAI + Search secrets.')
param keyVaultName string = 'karabo-keyvault'

@description('Allowed CORS origin (Static Web App URL).')
param allowedOrigin string = '*'

@description('Azure OpenAI embedding deployment name.')
param embeddingDeployment string = 'text-embedding-3-large'

@description('Azure AI Search endpoint.')
param searchEndpoint string = 'https://id8-search.search.windows.net'

@description('Azure AI Search index name.')
param searchIndex string = 'karabo-knowledge'

var resourceToken = uniqueString(subscription().id, resourceGroup().id, environmentName)
var tags = { 'azd-env-name': environmentName }

// ---------- Storage (required by Functions) ----------
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'st${take(resourceToken, 18)}'
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    publicNetworkAccess: 'Enabled'
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource deploymentContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobServices
  name: 'app-package-${environmentName}'
  properties: {
    publicAccess: 'None'
  }
}

// ---------- Log Analytics + App Insights ----------
resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${environmentName}-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${environmentName}-${resourceToken}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: law.id
  }
}

// ---------- Flex Consumption Plan ----------
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'plan-${environmentName}-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  kind: 'functionapp,linux'
  properties: {
    reserved: true
  }
}

// ---------- Existing Key Vault (reference) ----------
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// ---------- Function App ----------
resource func 'Microsoft.Web/sites@2023-12-01' = {
  name: 'func-${environmentName}-${resourceToken}'
  location: location
  tags: union(tags, { 'azd-service-name': 'api' })
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}app-package-${environmentName}'
          authentication: {
            type: 'SystemAssignedIdentity'
          }
        }
      }
      runtime: {
        name: 'node'
        version: '20'
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 40
        instanceMemoryMB: 2048
      }
    }
    siteConfig: {
      cors: {
        allowedOrigins: [ allowedOrigin ]
        supportCredentials: false
      }
      appSettings: [
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appi.properties.ConnectionString }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AZURE_OPENAI_ENDPOINT', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ai-hub-endpoint)' }
        { name: 'AZURE_OPENAI_API_KEY', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=ai-hub-api-key)' }
        { name: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT', value: embeddingDeployment }
        { name: 'AZURE_OPENAI_EMBEDDING_API_VERSION', value: '2024-10-21' }
        { name: 'AZURE_SEARCH_ENDPOINT', value: searchEndpoint }
        { name: 'AZURE_SEARCH_INDEX', value: searchIndex }
        { name: 'AZURE_SEARCH_KEY', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=azure-search-admin-key)' }
        { name: 'ALPHA_VANTAGE_KEY', value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=alpha-vantage-key)' }
        { name: 'ALLOWED_ORIGIN', value: allowedOrigin }
      ]
    }
  }
}

// ---------- RBAC: Function App MI → Key Vault Secrets User ----------
var kvSecretsUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

resource kvAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: kv
  name: guid(kv.id, func.id, kvSecretsUserRoleId)
  properties: {
    principalId: func.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: kvSecretsUserRoleId
  }
}

// ---------- RBAC: Function App MI → Storage Blob Data Owner (for deployment container) ----------
var storageBlobOwnerRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b')

resource storageAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: guid(storage.id, func.id, storageBlobOwnerRoleId)
  properties: {
    principalId: func.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: storageBlobOwnerRoleId
  }
}

output AZURE_FUNCTION_APP_NAME string = func.name
output AZURE_FUNCTION_APP_HOSTNAME string = func.properties.defaultHostName
output AZURE_FUNCTION_APP_PRINCIPAL_ID string = func.identity.principalId
output AZURE_LOCATION string = location
