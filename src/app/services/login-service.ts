import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import type { Admin } from '../../models/admin.model';
import type { Chofer } from '../../models/chofer.model';
import type { Pasajero } from '../../models/pasajero.model';
import type { Usuario } from '../../models/usuario.model';

export interface LoginPayload {
  email: string;
  password: string;
}

export type LoginRequest = LoginPayload;

export interface LoginResponse {
  status: 0 | 1;
  msg: string;
  rol?: Usuario['rol'];
  idUsuario?: number;
  idChofer?: number;
  idPasajero?: number;
  idAdmin?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  estadoChofer?: Chofer['estadoChofer'];
  estadoPasajero?: Pasajero['estadoPasajero'];
  estadoAdmin?: Admin['estadoAdmin'];
  token?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly apiUrl = `${API_URL}/usuarios/login`;

  constructor(private http: HttpClient) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credenciales);
  }
}
