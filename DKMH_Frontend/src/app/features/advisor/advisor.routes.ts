import { Routes } from '@angular/router';
export const ADVISOR_ROUTES: Routes = [
  { path: 'dashboard', loadComponent: () => import('./advisor-dashboard/advisor-dashboard.component').then(c => c.AdvisorDashboardComponent) },
  
  { path: 'students', loadComponent: () => import('./advisor-students/advisor-students.component').then(c => c.AdvisorStudentsComponent) },
  
  { path: 'schedule', loadComponent: () => import('./advisor-schedule/advisor-schedule.component').then(c => c.AdvisorScheduleComponent) },
  
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
];