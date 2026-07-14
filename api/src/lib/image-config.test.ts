import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_IMAGE_API_VERSION,
  DEFAULT_IMAGE_DEPLOYMENT,
  buildImageGenerationPayload,
} from './image-config'

test('targets GPT-Image-1-mini through the current preview API', () => {
  assert.equal(DEFAULT_IMAGE_DEPLOYMENT, 'gpt-image-1-mini')
  assert.equal(DEFAULT_IMAGE_API_VERSION, '2025-04-01-preview')
})

test('uses a low-cost GPT Image request by default', () => {
  assert.deepEqual(buildImageGenerationPayload('test', {}), {
    prompt: 'test',
    size: '1024x1024',
    quality: 'low',
    output_format: 'png',
    n: 1,
  })
})

test('keeps requests within GPT Image supported options', () => {
  assert.deepEqual(buildImageGenerationPayload('test', { size: '1536x1024', quality: 'medium', n: 20 }), {
    prompt: 'test',
    size: '1536x1024',
    quality: 'medium',
    output_format: 'png',
    n: 4,
  })
})

test('rejects DALL-E-only and invalid runtime options', () => {
  assert.throws(() => buildImageGenerationPayload('test', { size: '1792x1024' }), /Unsupported image size/)
  assert.throws(() => buildImageGenerationPayload('test', { quality: 'hd' }), /Unsupported image quality/)
  assert.throws(() => buildImageGenerationPayload('test', { style: 'natural' }), /style is not supported/)
})