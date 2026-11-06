import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import holdingsRouter from './holdings';

test('holdings rejects missing, non-Bearer and invalid JWT with 401 JSON', async () => {
  process.env.JWT_SECRET = 'local-only-example-secret-for-test';
  const app = express();
  app.use('/api/holdings', holdingsRouter);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/holdings`;
    const unauthorizedHeaders: Record<string, string>[] = [{}, { Authorization: 'Basic invalid' }, { Authorization: 'Bearer invalid.jwt.value' }];
    for (const headers of unauthorizedHeaders) {
      const response = await fetch(url, { headers });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).success, false);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
