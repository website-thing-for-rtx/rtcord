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

export async function getServerInfo(serverId) {
    return await db.all(
        'SELECT * FROM servers WHERE id = ?',
        serverId
    )
}

export async function createChannel(serverId, name) {
  return await db.run(
    'INSERT INTO channels (serverId, name) VALUES (?, ?)',
    serverId,
    name
  );
}

export async function getChannels(serverId) {
  return await db.all(
    'SELECT * FROM channels WHERE serverId = ?',
    serverId
  );
}

export async function isChannelInServer(channelId, serverId) {
  const bool = await db.get(
    'SELECT 1 FROM channels WHERE id = ? AND serverId = ?',
    channelId,
    serverId
  );
  return !!bool;
}

export async function createServer(ownerId, name) {
  const result = await db.run(
    'INSERT INTO servers (name, ownerId) VALUES (?, ?)',
    name,
    ownerId
  );

  const serverId = result.lastID;

  await db.run(
    'INSERT INTO servers_users (serverId, userId) VALUES (?, ?)',
    serverId,
    ownerId
  );

  await db.run(
    'INSERT INTO channels (serverId, name) VALUES (?, ?)',
    serverId,
    'general'
  );

  return serverId;
}

export async function renameServer(serverId, newName) {
  const result = await db.run(
    'UPDATE servers SET name = ? WHERE id = ?', newName, serverId
  )

  return !!result;
}