export const DEFAULT_EMBEDDING_DEPLOYMENT = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

export function getEmbeddingDeployment(): string {
  return process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT?.trim() || DEFAULT_EMBEDDING_DEPLOYMENT
}

export function isValidEmbeddingVector(vector: number[] | undefined): vector is number[] {
  return Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS
}

export function validateEmbeddingVectors(vectors: number[][]): void {
  for (const vector of vectors) {
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, received ${vector.length}`,
      )
    }
  }
}

export function cosineSimilarity(left: number[], right: number[]): number {
  validateEmbeddingVectors([left, right])
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0
  for (let index = 0; index < EMBEDDING_DIMENSIONS; index++) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] * left[index]
    rightMagnitude += right[index] * right[index]
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}