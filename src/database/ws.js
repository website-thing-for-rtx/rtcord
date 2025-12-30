import { db } from './index.js';

export async function noteMessage(message, serverId, userId, channelId) {
    await db.run('INSERT INTO messages (message, serverId, userId, channelId) VALUES (?, ?, ?, ?)', message, serverId, userId, channelId);
}