const ws = new WebSocket('wss://rtcord.rtx3080ti0415.qzz.io');
const container = document.querySelector(".msgs");
const messageInput = document.querySelector(".messageInput");
const buttonSend = document.querySelector(".sendMsg");

function renderMessage(msg) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.dataset.userid = msg.userId;
  messageDiv.dataset.messageid = msg.id;

  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = `/avatars/${msg.userId}.png`;
  avatar.width = 120;
  avatar.height = 120;
  avatar.onerror=`this.onerror=null; this.src='/avatars/${msg.userId}.png';`;

  const text = document.createElement('p');
  text.className = 'text';
  //text.textContent = msg.message;
  text.append(renderTextWithEmojis(msg.message));

  const name = document.createElement('p');
  name.className = 'name';
  name.textContent = userMap[msg.userId];
  
  if (userMap[msg.userId] == null || userMap[msg.userId] == "")
    fetch('/api/user/' + msg.userId)
    .then(x => name.textContent = x)

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(name);
  messageDiv.appendChild(text);

  return messageDiv;
}

function renderTextWithEmojis(text) {
  const container = document.createElement('span');
  const regex = /:([a-zA-Z0-9_]+):/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text))) {
    container.append(text.slice(lastIndex, match.index));

    const img = document.createElement('img');
    img.className = 'emoji';
    img.src = `/emojis/${match[1]}.jpg`;
    img.alt = match[0];
    img.width = 100;
    img.height = 100;

    container.append(img);
    lastIndex = regex.lastIndex;
  }

  container.append(text.slice(lastIndex));
  return container;
}


function broadcast(userId, message, serverId, channelId) {
  const msg = JSON.stringify({ userId, serverId, message, channelId });

  ws.send(msg);
}

buttonSend.addEventListener('click', () => {
    broadcast(userId, messageInput.value, serverId, channelId);
});

ws.onopen = () => {
  console.log('WS connected');
};

ws.onmessage = (event) => {
  console.log('WS message:', event.data);
  const msg = JSON.parse(event.data);
  if (msg.channelId != channelId)
    return;
  container.appendChild(renderMessage(msg));
};

ws.onclose = () => {
  console.log('WS closed');
};

ws.onerror = (err) => {
  console.error('WS error', err);
};

document.querySelectorAll('.text').forEach(p => {
  console.log(p);
  const raw = JSON.parse(p.dataset.message);
  p.textContent = '';
  p.append(renderTextWithEmojis(raw));
});
