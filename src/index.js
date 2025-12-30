import { db } from './database/index.js'
import { signup, login, isAdmin, getUserId } from './database/users.js'
import { noteMessage } from './database/ws.js'
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
dotenv.config();

app.use(session({
  name: 'rtcord.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
}));

let port = process.env.PORT
if (port == null)
    port = 7777

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

app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug')

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

wss.on('connection', (ws, req) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionID = cookies['rtcord.sid'];

  console.log('Raw session cookie:', sessionID);

  sessionParser.store.get(sessionID, (err, sessionData) => {
    if (err || !sessionData || !sessionData.user) {
      ws.close();
      return;
    }

    console.log('Authorized WS user:', sessionData.user.login);

    ws.user = sessionData.user;

    ws.on('message', (message) => {
        console.log('Received:', message.toString());

        const data = JSON.parse(message.toString());
        console.log('Received JSON:', data);

        //const reply = JSON.stringify({ echo: data });

        noteMessage(data.message, data.serverId, data.userId);

        /*wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) client.send(reply);
        });*/
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
  })
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

app.get('/:serverId/:channelId', (req, res) => {

})

server.listen(port, () => {
  console.log('RtCord seber softwar')
  console.log('copyrigh -69 me inc')
  console.log(`RtCord and websocket listening on port ${port}`)
})