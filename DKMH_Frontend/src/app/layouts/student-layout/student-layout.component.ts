import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; 
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css'
})
export class StudentLayoutComponent {
  studentName: string = 'Đang tải...'; 
  
    constructor(private authService: AuthService) {} 
  
    ngOnInit(): void {
      this.studentName = this.authService.getUserName() || 'Nguyễn Văn B'; 
    }
  
    logout(): void {
      this.authService.logout();
    }
}
