import { Component } from '@angular/core';
import { AuthService, UserData, LoginResponse } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData = {
    id: '',
    password: ''
  };
  loginError: string | null = null; 
  public showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.loginError = null;

    if (!this.loginData.id || !this.loginData.password) {
      this.loginError = 'Vui lòng nhập đầy đủ thông tin!';
      return;
    }

    this.authService
      .login({ id: this.loginData.id, password: this.loginData.password })
      .subscribe({
        next: (res: LoginResponse) => {
          if (res.success && res.data) {
            const user: UserData = res.data;
            
            this.authService.saveUserData(user); 

            switch (user.loai) {
              case 'Quản trị viên':
              case 'Admin':
                this.router.navigate(['/admin/dashboard']);
                break;
              case 'Giảng viên':
              case 'Advisor':
                this.router.navigate(['/advisor/dashboard']);
                break;
              case 'Sinh viên':
              case 'Student':
                this.router.navigate(['/student/dashboard']);
                break;
              default:
                this.authService.logout();
                this.loginError = 'Tài khoản không có quyền truy cập!';
            }
          } else {           
            this.loginError = res.message || 'Đăng nhập thất bại!';
          }
        },
        error: (err) => {
          console.error('❌ Lỗi đăng nhập:', err);
          this.loginError = 'Không thể kết nối đến máy chủ hoặc sai thông tin!';
        },
      });
  }
}