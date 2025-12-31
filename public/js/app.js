const ws = new WebSocket('ws://rtcord.rtx3080ti0415.qzz.io:32768');
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

  const text = document.createElement('p');
  text.className = 'text';
  text.textContent = msg.message;

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
