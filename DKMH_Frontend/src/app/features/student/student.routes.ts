import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  { path: 'dashboard', loadComponent: () => import('./student-dashboard/student-dashboard.component').then(c => c.StudentDashboardComponent) },
  { path: 'register', loadComponent: () => import('./student-register/student-register.component').then(c => c.StudentRegisterComponent) },
  { path: 'timetable', loadComponent: () => import('./student-timetable/student-timetable.component').then(c => c.StudentTimetableComponent) },
  { path: 'notifications', loadComponent: () => import('./student-notifications/student-notifications.component').then(c => c.StudentNotificationsComponent) },
  { path: 'profile', loadComponent: () => import('./student-profile/student-profile.component').then(c => c.StudentProfileComponent) },
  { path: 'support', loadComponent: () => import('./student-support/student-support.component').then(c => c.StudentSupportComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
];