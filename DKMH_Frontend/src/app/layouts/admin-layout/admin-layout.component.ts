import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  adminName: string = 'Đang tải...'; 

  constructor(private authService: AuthService) {} 

  ngOnInit(): void {
    this.adminName = this.authService.getUserName() || 'Nguyễn Văn B'; 
  }

  logout(): void {
    this.authService.logout();
  }

}
