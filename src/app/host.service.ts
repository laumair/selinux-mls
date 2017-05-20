import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Http } from '@angular/http';

@Injectable()
export class HostService {
  private url = 'http://127.0.0.1:9000/api';
  constructor(private http: Http) { }

  fetchStatus(): Observable<any> {
    return this.http.get(`${this.url}/status`)
      .map(res => res.json())
      .catch(err => Observable.throw(err));
  }

  configureMLS(): Observable<any> {
    return this.http.get(`${this.url}/mls`)
      .map(res => res.json())
      .catch(err => Observable.throw(err));
  }
}
