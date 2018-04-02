const R = require('ramda');
const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use('/build', express.static('build'));
app.use('/node_modules', express.static('node_modules'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let player1 = '';
let player2 = '';
let queue = [];

const armData = {
  p1: [[10, 10], [10, 20], [10, 10], [10, 20]],
  p2: [[10, 10], [10, 20], [10, 10], [10, 20]],
};

io.on('connection', (socket) => {
  console.log('a user connected');
  if (player1 === '') {
    player1 = socket.id;
  } else if (player2 === '') {
    player2 = socket.id;
  } else {
    queue.push(socket.id);
  }
  console.log('new: ', socket.id, ' p1: ', player1, ' p2: ', player2, ' queue: ', queue.length);

  socket.on('client-update', (data) => {
    /* client data shape
       [elbow1, wrist1, elbow2, wrist2]
    */
    // TODO PUT CLIENT IN PROPER POSITION
    // console.log(data);
    if (socket.id === player1) {
      armData.p1 = data;
    } else if (socket.id === player2) {
      armData.p2 = data;
    }
    io.emit('server-update', R.concat(armData.p1, armData.p2));
    /* data shape
      [elbow1, wrist1, elbow2, wrist2, elbow3, wrist3, elbow4, wrist4]
    */
  });

  socket.on('disconnect', () => {
    if (player1 === socket.id) {
      console.log('p1 left');
      player1 = player2;
      if (queue.length > 0) {
        player2 = R.nth(0, queue);
        queue = R.tail(queue);
      } else {
        player2 = '';
      }
    } else if (player2 === socket.id) {
      console.log('p2 left');
      if (queue.length > 0) {
        player2 = R.nth(0, queue);
        queue = R.tail(queue);
      } else {
        player2 = '';
      }
    } else {
      queue.filter(R.compose(R.not, R.equals(socket.id)));
    }

    console.log('new: ', socket.id, ' p1: ', player1, ' p2: ', player2, ' queue: ', queue.length);
  });
});
const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log('listening on *:3000');
});
