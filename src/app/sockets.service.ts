import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SocketsService {
  private url = 'http://127.0.0.1:9000';
  private socket;

  getLogs(): Observable<any> {
    return new Observable(observer => {
      this.socket = io(this.url);

      this.socket.on('message', (data) => observer.next(data));

      return () => this.socket.disconnect();
    });
  }
}
