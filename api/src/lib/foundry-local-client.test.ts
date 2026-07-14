import assert from 'node:assert/strict'
import test from 'node:test'
import { getFoundryLocalStatus, tryFoundryLocalChat } from './foundry-local-client'

const KEYS = [
  'NODE_ENV',
  'AZURE_FUNCTIONS_ENVIRONMENT',
  'FOUNDRY_LOCAL_ENABLED',
  'FOUNDRY_LOCAL_ENDPOINT',
  'FOUNDRY_LOCAL_MODEL',
] as const

async function withEnvironment(values: Partial<Record<(typeof KEYS)[number], string>>, run: () => Promise<void> | void) {
  const previous = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
  for (const key of KEYS) delete process.env[key]
  Object.assign(process.env, values)
  try {
    await run()
  } finally {
    for (const key of KEYS) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('enables Foundry Local only with an explicit loopback development configuration', async () => {
  await withEnvironment({
    FOUNDRY_LOCAL_ENABLED: 'true',
    FOUNDRY_LOCAL_ENDPOINT: 'http://127.0.0.1:5764',
  }, () => {
    assert.deepEqual(getFoundryLocalStatus(), {
      configured: true,
      enabledForRuntime: true,
      model: 'phi-4-mini-instruct',
    })
  })
})

test('fails closed in production and for non-loopback endpoints', async () => {
  for (const values of [
    { NODE_ENV: 'production', FOUNDRY_LOCAL_ENABLED: 'true', FOUNDRY_LOCAL_ENDPOINT: 'http://127.0.0.1:5764' },
    { FOUNDRY_LOCAL_ENABLED: 'true', FOUNDRY_LOCAL_ENDPOINT: 'https://example.com' },
  ]) {
    await withEnvironment(values, async () => {
      let calls = 0
      const result = await tryFoundryLocalChat(
        { prompt: 'test', task: 'general', expectJson: false },
        async () => { calls += 1; return new Response() },
      )
      assert.equal(result, null)
      assert.equal(calls, 0)
    })
  }
})

test('accepts valid local JSON and rejects malformed JSON for Azure fallback', async () => {
  await withEnvironment({
    FOUNDRY_LOCAL_ENABLED: 'true',
    FOUNDRY_LOCAL_ENDPOINT: 'http://localhost:5764',
    FOUNDRY_LOCAL_MODEL: 'test-model',
  }, async () => {
    const valid = await tryFoundryLocalChat(
      { prompt: 'test', task: 'general', expectJson: true },
      async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    assert.equal(valid?.source, 'foundry-local')
    assert.equal(valid?.model, 'test-model')

    await assert.rejects(
      () => tryFoundryLocalChat(
        { prompt: 'test', task: 'general', expectJson: true },
        async () => new Response(JSON.stringify({ choices: [{ message: { content: 'not json' } }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
      SyntaxError,
    )
  })
})