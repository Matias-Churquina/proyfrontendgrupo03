import { Service } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface LoginPayload {
  email: string;
  password: string;
}

@Service()
export class LoginService {
    private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = 'http://localhost:3000/api/usuarios';

  login(credenciales: LoginPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  guardarSesion(usuarioData: any): void {
    sessionStorage.setItem('usuario_perico', JSON.stringify(usuarioData));
  }

  logout(): void {
    sessionStorage.removeItem('usuario_perico');
    this.router.navigate(['/Home']); // cierra sesión y redirige al Home
  }

  userLoggedIn(): boolean {
    const usuario = sessionStorage.getItem('usuario_perico');
    return usuario !== null;
  }

  getUserData(): any {
    const usuario = sessionStorage.getItem('usuario_perico');
    return usuario ? JSON.parse(usuario) : null;
  }
}
