const ws = new WebSocket('ws://rtcord.rtx3080ti0415.qzz.io:32768');

ws.onopen = () => {
  console.log('WS connected');
};

ws.onmessage = (event) => {
  console.log('WS message:', event.data);
};

ws.onclose = () => {
  console.log('WS closed');
};

ws.onerror = (err) => {
  console.error('WS error', err);
};
