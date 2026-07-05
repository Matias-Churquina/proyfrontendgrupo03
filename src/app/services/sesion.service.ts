import { Injectable } from '@angular/core';
import type { Admin } from '../../models/admin.model';
import type { Chofer } from '../../models/chofer.model';
import type { Pasajero } from '../../models/pasajero.model';
import type { Usuario } from '../../models/usuario.model';

export type RolUsuario = Usuario['rol'];

export interface UsuarioSesion {
  idUsuario: number;
  idChofer?: number;
  idPasajero?: number;
  idAdmin?: number;
  rol: RolUsuario;
  nombre: string;
  apellido: string;
  email: string;
  estadoChofer?: Chofer['estadoChofer'];
  estadoPasajero?: Pasajero['estadoPasajero'];
  estadoAdmin?: Admin['estadoAdmin'];
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class SesionService {
  private readonly TOKEN_KEY = 'token';
  private readonly USUARIO_KEY = 'usuarioSesion';

  guardarSesion(datos: UsuarioSesion): void {
    localStorage.setItem(this.TOKEN_KEY, datos.token);
    localStorage.setItem(this.USUARIO_KEY, JSON.stringify(datos));
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  obtenerUsuario(): UsuarioSesion | null {
    const usuario = localStorage.getItem(this.USUARIO_KEY);
    return usuario ? JSON.parse(usuario) : null;
  }

  estaLogueado(): boolean {
    return !!this.obtenerToken();
  }

  obtenerRol(): RolUsuario | null {
    const usuario = this.obtenerUsuario();
    return usuario ? usuario.rol : null;
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USUARIO_KEY);
  }
}
