targetScope = 'resourceGroup'

@description('Existing Azure AI Services/OpenAI account that hosts the model deployments.')
param aiServicesAccountName string

@description('Managed identity principal that requires inference access.')
param principalId string

resource aiServicesAccount 'Microsoft.CognitiveServices/accounts@2023-05-01' existing = {
  name: aiServicesAccountName
}

// Cognitive Services OpenAI User: chat/completions and embeddings inference,
// without permission to create resources, deployments, or regenerate keys.
var cognitiveServicesOpenAIUserRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
)

resource aiInferenceAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: aiServicesAccount
  name: guid(aiServicesAccount.id, principalId, cognitiveServicesOpenAIUserRoleId)
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: cognitiveServicesOpenAIUserRoleId
  }
}
