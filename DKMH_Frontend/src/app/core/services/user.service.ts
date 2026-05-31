import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentData {
    ma_sv: string;
    ho_ten: string;
    email: string;
    ngay_sinh: Date;
    lop: string;
    nganh: string;
    trang_thai_hoc_tap: string;
}
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  login(id: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { id, password });
  }

  getAllUsers(): Observable<any> { 
    return this.http.get<any>(this.apiUrl);
  }

  createUser(userData: any): Observable<any> { 
    return this.http.post<any>(this.apiUrl, userData);
  }

  updateUser(id: string, userData: any): Observable<any> { 
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getStudentsByMaLop(maLop: string): Observable<StudentData[]> {
        const params = new HttpParams().set('ma_lop', maLop);
        return this.http.get<StudentData[]>(`${this.apiUrl}/students/by-lop`, { params });
    }

  getProfile(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/${id}`);
  }

  updateProfile(id: string, updatedData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updatedData);
  }

  changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
  return this.http.put<any>(`${this.apiUrl}/${userId}/change-password`, data);
}

  resetPassword(id: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}/reset-password`, {});
}

  getRegisteredCredits(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(id)}/credits/registered`);
  }

  getAllCredits() {
    return this.http.get<any>(`${this.apiUrl}/credits/all`);
  }
}
