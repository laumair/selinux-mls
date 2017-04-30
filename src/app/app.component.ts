import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketsService } from './sockets.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public logs = Array() as string[];
  sockets;

  constructor(private socketsService: SocketsService) { }

  ngOnInit() {
    this.sockets = this.socketsService.getLogs().subscribe(log => this.logs.push(log));
  }

  ngOnDestroy() {
    this.sockets.unsubscribe();
  }
}
