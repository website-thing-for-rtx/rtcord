import { expect, test } from 'vitest'
import { getDB } from './index.js';

test('database is defined', async () => {
  const db = await getDB();
  expect(db).toBeDefined();
});
