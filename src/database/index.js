import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/*export const db = await open({
  filename: './database.sqlite',
  driver: sqlite3.Database
});

export async function testDb() {
  return db;
}*/

export async function getDB() {
  return await open({ filename: './database.sqlite', driver: sqlite3.Database });
}

export const db = await getDB();