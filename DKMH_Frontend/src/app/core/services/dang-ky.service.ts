import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DangKyService {
  private apiUrl = 'http://localhost:3000/api/dang-ky';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }

  getBySinhVien(ma_sv: string): Observable<any> {
    const params = new HttpParams().set('ma_sv', ma_sv);
    return this.http.get<any>(this.apiUrl, { params });
  }

  getByHocKy(hocKy: number): Observable<any> {
    const params = new HttpParams().set('hoc_ky', String(hocKy));
    return this.http.get<any>(this.apiUrl, { params });
  }

  getRegistrationsByStatus(ma_sv?: string, trang_thai?: string): Observable<any> {
    let params = new HttpParams();
    if (ma_sv) params = params.set('ma_sv', ma_sv);
    if (trang_thai) params = params.set('trang_thai', trang_thai);
    return this.http.get<any>(this.apiUrl, { params });
  }

  createRegistration(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${encodeURIComponent(id)}`, data);
  }

  deleteRegistration(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }

  getPendingRegistrations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pending`);
  }

}
