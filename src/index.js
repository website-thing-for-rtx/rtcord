import { db } from './database/index.js'
import { signup, login, isAdmin, getUserId, getUserName } from './database/users.js'
import { noteMessage } from './database/ws.js'
import { getAllMessagesFrom } from './database/messages.js';
import { getServersUserIsIn, isUserIn, addUserToServer, getChannels } from './database/servers.js'
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import cookie from 'cookie';
import { parse } from 'cookie';
import { channel } from 'diagnostics_channel';
import signature from 'cookie-signature';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
dotenv.config();

const sessionParser = session({
  name: 'rtcord.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
})

app.use(sessionParser);

let port = process.env.PORT
if (port == null)
    port = 7777

let mode = process.env.MODE
if (mode == null)
    mode = "server"

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    serverId INTEGER,
    userId INTEGER,
    channelId INTEGER
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ownerId INTEGER NOT NULL
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS servers_users (
    serverId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    PRIMARY KEY (serverId, userId)
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serverId INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'text'
  )
`);

if (mode == "server")
  await sendDiscordWebhook({
        content: '<@&1455969806132973744>',
          embeds: [
            {
              title: 'power on',
              description: 'rtcord is on',
              color: 0x00ff00,
              timestamp: new Date().toISOString(),
            },
          ],
        });

app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '..', 'public', 'views'));

app.post('/api/signup', async (req, res) => {
    const { login, pass } = req.body;

    if (await signup(login, pass))
        res.status(201).send({ message: 'User created, you need to login again cuz me lazy' });
    else
        res.status(500).send({ message: 'User already exists or internal server error' });
})

app.post('/api/login', async (req, res) => {
    const { loginuser, pass } = req.body;

    if (await login(loginuser, pass)) {
        req.session.user = {
            login: loginuser
        };
        if (isBrowser(req)) {
          return res.redirect('/');
        }
        res.status(200).send({ message: 'User logged in successfully' });
    }
    else
        res.status(401).send({ message: 'User unauthorized' });
})

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send('Not logged in');
  }
  next();
}

app.get('/admin', requireAuth, async (req, res) => {
  //res.json(req.session.user);
  if (!(await isAdmin(req.session.user.login))) {
    return res.status(403).send('Unauthorized');
  }

  //res.send('wil be admin panel');
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'))
});

server.on('upgrade', (req, socket, head) => {
  sessionParser(req, {}, () => {
    if (!req.session?.user) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = req.session.user;

      wss.emit('connection', ws, req);
    });
  });
});

wss.on('connection', (ws, req) => {
  //console.log('Authorized WS user:', ws.user.login);

  ws.on('message', (message) => {
      console.log('Received:', message.toString());

      const data = JSON.parse(message.toString());
      console.log('Received JSON:', data);

      //const reply = JSON.stringify({ echo: data });

      noteMessage(data.message, data.serverId, data.userId, data.channelId);

      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(data));
        }
      });

      /*wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) client.send(reply);
      });*/

  });

  ws.on('close', () => {
      console.log('Client disconnected');
  });
});

//const ws = new WebSocket('ws://localhost:7777');

app.post('/api/sendMessage', requireAuth, async (req, res) => {
    const userID = await getUserId(req.session.user.login);
    const { msg, serverId } = req.body;

    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({
                message: msg,
                serverId: serverId,
                userId: userID
            }));
        }
    });

    res.status(200).send('shi');
})

app.get('/api/user/:userId', async (req, res) => {
  return res.status(200).send(getUserName(req.params.userId));
})

app.get('/chat/:serverId/:channelId', requireAuth, async (req, res) => {
  const messages = await getAllMessagesFrom(req.params.serverId, req.params.channelId);
  
  const userId = await getUserId(req.session.user.login);
  const channels = await getChannels(req.params.serverId);

  const userIds = [...new Set(messages.map(m => m.userId))];
  const users = await db.all(
    `SELECT id, login FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
    ...userIds
  );
  const userMap = Object.fromEntries(users.map(u => [u.id, u.login]));

  console.log(
    'messages:',
    messages,
    'type:',
    typeof messages,
    'isArray:',
    Array.isArray(messages)
  );

  if (!isUserIn(req.params.serverId, getUserId(req.session.user.login))) {
    return res.status(401).send("Unauthorized, ur prob not in seber");
  }

  res.render('chat', {
    messages: messages,
    serverId: req.params.serverId,
    channelId: req.params.channelId,
    userId,
    channels,
    userMap
  });
})

async function sendDiscordWebhook({ content, embeds }) {
  const url = process.env.WEBHOOK;
  
  const body = {};
  if (content) body.content = content;
  if (embeds) body.embeds = embeds;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

process.on('SIGINT', async () => {
  console.log('by');
  if (mode == "dev")
    process.exit(0)
  try {
    await sendDiscordWebhook({
      content: '<@&1455969806132973744>',
        embeds: [
          {
            title: 'shutdown',
            description: 'rtcord shutting down',
            color: 0xff0000,
            timestamp: new Date().toISOString(),
          },
        ],
      });
  } catch (err) {
    console.error('it no worked', err);
  }
  process.exit(0);
});

function isBrowser(req) {
  const ua = req.headers['user-agent'] || '';
  return /Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua);
}

server.listen(port, () => {
  console.log('RtCord seber softwar')
  console.log('copyrigh -69 me inc')
  console.log(`RtCord and websocket listening on port ${port}`)
})