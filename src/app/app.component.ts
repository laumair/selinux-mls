import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketsService } from './sockets.service';
import { HostService } from './host.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public logs = Array() as string[];
  public error: string;
  public mlsStatus = '';
  public credentials: any;
  sockets;

  constructor(private socketsService: SocketsService, private hostService: HostService) { }

  ngOnInit() {
    this.sockets = this.socketsService.getLogs().subscribe(log => this.logs.push(log));
    this.hostService.fetchStatus().subscribe(
      (data) => {
        this.credentials = data;
        if (this.credentials.isConfiguring) {
          this.mlsStatus = 'MLS configuration already in progress.';
        }
      },
      (err) => this.error = 'Something went wrong while fetching your machine credentials. Try reloading the page to make a retry attempt.'
    );
  }

  ngOnDestroy() {
    this.sockets.unsubscribe();
  }

  configure() {
    this.hostService.configureMLS().subscribe(
      (data) => {
        this.mlsStatus = 'MLS configuration in progress. You will start getting real time logs shortly.';
        this.credentials.isConfiguring = data.isConfiguring;
      },
      (err) => this.mlsStatus = 'Something went wrong while starting off configuration for MLS. Please retry.'
    );
  }
}
