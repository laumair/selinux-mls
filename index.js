import app from './src/server/config/lib/express';
import createWithSocketIO from './src/server/config/lib/socket.io';

const server = createWithSocketIO(app);

server.listen(process.env.PORT || 9000, () => {
  console.log('Server started at: http://127.0.0.1:9000'); // eslint-disable-line no-console
});
