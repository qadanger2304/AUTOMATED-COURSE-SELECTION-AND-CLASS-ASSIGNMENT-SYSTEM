import { Routes } from '@angular/router';

// --- 1. Import Layout Components ---
import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';
import { AdvisorLayoutComponent } from './layouts/advisor-layout/advisor-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// --- 2. Import Guards (Bảo vệ Route) ---
export const routes: Routes = [
  
  // --- LUỒNG 1A: TRANG ĐĂNG NHẬP ---
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  
  // --- LUỒNG 1B: ĐƯỜNG DẪN GỐC ---
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  

  // --- LUỒNG 2: SINH VIÊN (/student) ---
  {
    path: 'student',
    component: StudentLayoutComponent, 
    data: { expectedRole: 'Sinh viên' }, 
    loadChildren: () => import('./features/student/student.routes').then(r => r.STUDENT_ROUTES) 
  },

  // --- LUỒNG 3: CỐ VẤN HỌC TẬP (/advisor) ---
  {
    path: 'advisor',
    component: AdvisorLayoutComponent, 
    data: { expectedRole: 'Giảng viên' },
    loadChildren: () => import('./features/advisor/advisor.routes').then(r => r.ADVISOR_ROUTES) 
  },

  // --- LUỒNG 4: QUẢN TRỊ VIÊN (/admin) ---
  {
    path: 'admin',
    component: AdminLayoutComponent, 
    data: { expectedRole: 'Quản trị viên' },
    loadChildren: () => import('./features/admin/admin.routes').then(r => r.ADMIN_ROUTES) 
  },

  // --- LUỒNG 5: XỬ LÝ LỖI (404) ---
  { path: '**', redirectTo: 'login' } 
];