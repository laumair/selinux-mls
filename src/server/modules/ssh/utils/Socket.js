export default class Socket {
  constructor(socket) {
    this.socket = socket;
  }

  emit(event, data) {
    this.socket.emit(event, data);
  }

  emitDefaultEvent(data) {
    this.emit('message', data);
  }
}
