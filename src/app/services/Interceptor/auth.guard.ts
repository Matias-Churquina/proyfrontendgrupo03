import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { LoginService } from '../../services/login-service';

export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  
  const usuario = loginService.usuarioSesionSignal();
  
  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }
  const rolesPermitidos = route.data['roles'] as Array<string>;
  
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    router.navigate(['/' + usuario.rol.toLowerCase() + '-dashboard']);
    return false;
  }

  return true;
};