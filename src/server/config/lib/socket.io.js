import socketio from 'socket.io';
import http from 'http';

export default (app) => {
  const server = http.createServer(app);
  const io = socketio.listen(server);

  app.set('socketio', io);
  io.on('connection', socket => console.log(socket.id)); // eslint-disable-line no-console

  return server;
};
