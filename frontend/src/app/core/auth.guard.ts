import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.login();
  return false;
};

export function roleGuard(requiredRole: string): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      auth.login();
      return false;
    }

    if (auth.hasRole(requiredRole)) {
      return true;
    }

    return router.createUrlTree(['/dashboard'], {
      queryParams: { unauthorized: requiredRole },
    });
  };
}
