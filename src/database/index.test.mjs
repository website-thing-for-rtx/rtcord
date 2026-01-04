import { expect, test } from 'vitest'
import { getDB } from './index.js';
import { getAllMessagesFrom } from './messages.js';

test('database is defined', async () => {
  const db = await getDB();
  expect(db).toBeDefined();
});

test('message list is defined', async () => {
  const messages = await getAllMessagesFrom(1, 1);
  expect(messages).toBeDefined();
});
