import { db } from './index.js'

export async function getAllMessagesFrom(serverId, channelId) {
  const messages = await db.all('SELECT * FROM messages WHERE serverId = ? AND channelId = ?', serverId, channelId);
  return messages;
}