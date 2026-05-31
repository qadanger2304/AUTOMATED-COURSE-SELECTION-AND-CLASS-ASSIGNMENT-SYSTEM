import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private apiUrl = 'http://localhost:3000/api/logs';

  constructor(private http: HttpClient) {}

  getAllLogs(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  createLog(logData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, logData);
  }

  deleteAllLogs(): Observable<any> {
    return this.http.delete<any>(this.apiUrl);
  }

  deleteLog(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  deleteLogById(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/logs/${id}`);
}
}
