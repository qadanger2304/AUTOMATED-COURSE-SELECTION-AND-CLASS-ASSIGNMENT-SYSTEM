import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent) },
  
  { path: 'subjects', loadComponent: () => import('./admin-subjects/admin-subjects.component').then(c => c.AdminSubjectsComponent) },
  
  { path: 'timetable', loadComponent: () => import('./admin-timetable/admin-timetable.component').then(c => c.AdminTimetableComponent) },
  
  { path: 'classes', loadComponent: () => import('./admin-classes/admin-classes.component').then(c => c.AdminClassesComponent) },
  
  { path: 'teachers', loadComponent: () => import('./admin-teachers/admin-teachers.component').then(c => c.AdminTeachersComponent) },
  
  { path: 'statistics', loadComponent: () => import('./admin-statistics/admin-statistics.component').then(c => c.AdminStatisticsComponent) },
  
  { path: 'logs', loadComponent: () => import('./admin-logs/admin-logs.component').then(c => c.AdminLogsComponent) },

  { path: 'users', loadComponent: () => import('./admin-users/admin-users.component').then(c=>c.AdminUsersComponent)},
  
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];