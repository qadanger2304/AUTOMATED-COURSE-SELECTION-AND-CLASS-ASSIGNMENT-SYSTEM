import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Lấy vai trò yêu cầu từ route (ví dụ: 'Admin')
  const expectedRole = route.data['expectedRole'];

  // 2. Lấy vai trò hiện tại của người dùng (Giả định AuthService có hàm này)
  const currentUserRole = authService.getUserRole(); 

  // 3. So sánh
  if (currentUserRole && currentUserRole === expectedRole) {
    return true;
  } else {
    alert('Bạn không có quyền truy cập vào trang này!');
    router.navigate(['/dashboard']);
    return false;
  }
};