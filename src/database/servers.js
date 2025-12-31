import { db } from './index.js'

export async function isUserIn(serverId, userId) {
  const bool = await db.get('SELECT 1 FROM servers_users WHERE serverId = ? AND userId = ? LIMIT 1', serverId, userId);
  return !!bool;
}

export async function addUserToServer(userId, serverId) {
  await db.run(
    'INSERT OR IGNORE INTO servers_users (serverId, userId) VALUES (?, ?)',
    serverId,
    userId
  );
}

export async function getServersUserIsIn(userId) {
  return await db.all(
    'SELECT serverId FROM servers_users WHERE userId = ?',
    userId
  );
}
