import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginCredentials {
  id: string;      
  password: string; 
}

export interface UserData {
    _id: string;
    ho_ten: string;
    loai: string;
    email: string;
    ma_sv: string;
    ma_gv: string;
}

export interface LoginResponse {
    success: boolean;
    data?: UserData;
    message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/users'; 
  
  private ROLE_KEY = 'user_role';
  private NAME_KEY = 'user_name';
  private ID_KEY = 'user_id';
  private MA_SV_KEY = 'user_ma_sv';
  private MA_GV_KEY = 'user_ma_gv';

  constructor(
    private http: HttpClient, 
    private router: Router
  ) { }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  saveUserData(data: UserData): void {
      localStorage.setItem(this.ROLE_KEY, data.loai); 
      localStorage.setItem(this.NAME_KEY, data.ho_ten); 
      localStorage.setItem(this.ID_KEY, data._id);
      localStorage.setItem(this.MA_SV_KEY, data.ma_sv);
      localStorage.setItem(this.MA_GV_KEY, data.ma_gv || '');
  }

  getUserId(): string | null {
    return localStorage.getItem(this.ID_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }
  
  getUserName(): string | null {
    return localStorage.getItem(this.NAME_KEY);
  }

  getUserMaSV(): string | null {
    return localStorage.getItem(this.MA_SV_KEY);
  }

  getUserMaGV(): string | null {
    return localStorage.getItem(this.MA_GV_KEY);
  }


  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.ROLE_KEY); 
  }

  logout(): void {
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.NAME_KEY);
    localStorage.removeItem(this.ID_KEY);
    localStorage.removeItem(this.MA_SV_KEY);
    localStorage.removeItem(this.MA_GV_KEY);
    this.router.navigate(['/login']);
  }
}