import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from '../../services/login-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos tu servicio unificado
  const loginService = inject(LoginService);
  
  // Obtenemos el token del sessionStorage
  const token = loginService.obtenerToken();

  // Si existe un token, clonamos la petición original y le pegamos el token con Bearer en el header Authorization
  if (token) {
    const peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(peticionClonada);
  }
  return next(req);
};
