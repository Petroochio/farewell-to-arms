const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use('/build', express.static('build'));
app.use('/node_modules', express.static('node_modules'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('client-update', (data) => {
    console.log(data);
    io.emit('server-update', data);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
