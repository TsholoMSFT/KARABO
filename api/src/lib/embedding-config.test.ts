import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_EMBEDDING_DEPLOYMENT,
  EMBEDDING_DIMENSIONS,
  cosineSimilarity,
  getEmbeddingDeployment,
  isValidEmbeddingVector,
  validateEmbeddingVectors,
} from './embedding-config'

test('defaults to text-embedding-3-small with 1536 dimensions', () => {
  const previous = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
  delete process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT

  try {
    assert.equal(getEmbeddingDeployment(), DEFAULT_EMBEDDING_DEPLOYMENT)
    assert.equal(EMBEDDING_DIMENSIONS, 1536)
  } finally {
    if (previous === undefined) delete process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
    else process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT = previous
  }
})

test('accepts vectors matching the configured dimensions', () => {
  assert.equal(isValidEmbeddingVector(new Array(EMBEDDING_DIMENSIONS).fill(0)), true)
  assert.doesNotThrow(() => validateEmbeddingVectors([new Array(EMBEDDING_DIMENSIONS).fill(0)]))
})

test('rejects vectors from an incompatible embedding index', () => {
  assert.equal(isValidEmbeddingVector(new Array(3072).fill(0)), false)
  assert.throws(
    () => validateEmbeddingVectors([new Array(3072).fill(0)]),
    /expected 1536, received 3072/,
  )
  assert.throws(
    () => cosineSimilarity(new Array(EMBEDDING_DIMENSIONS).fill(1), new Array(3072).fill(1)),
    /expected 1536, received 3072/,
  )
})