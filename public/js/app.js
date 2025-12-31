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

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(text);

  return messageDiv;
}

function broadcast(userId, message, serverId) {
  const msg = JSON.stringify({ userId, serverId, message });

  ws.send(msg);
}

buttonSend.addEventListener('click', () => {
    broadcast(1, messageInput.value, 1);
});

ws.onopen = () => {
  console.log('WS connected');
};

ws.onmessage = (event) => {
  console.log('WS message:', event.data);
  const msg = JSON.parse(event.data);
  container.appendChild(renderMessage(msg));
};

ws.onclose = () => {
  console.log('WS closed');
};

ws.onerror = (err) => {
  console.error('WS error', err);
};
