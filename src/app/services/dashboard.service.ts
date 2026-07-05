import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

export interface DashboardGrupo {
  estado: string;
  cantidad: number;
}

export interface DashboardFecha {
  fecha: string;
  cantidad: number;
}

export interface DashboardData {
  status: string;
  msg: string;
  totales: {
    usuarios: number;
    pasajeros: number;
    choferes: number;
    autos: number;
    viajes: number;
    reservas: number;
  };
  viajesPorEstado: DashboardGrupo[];
  reservasPorEstado: DashboardGrupo[];
  reservasPorFecha: DashboardFecha[];
  choferesPorEstado: DashboardGrupo[];
  pasajerosPorEstado: DashboardGrupo[];
  autosPorEstado: DashboardGrupo[];
  ultimasReservas: any[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${API_URL}/admins/dashboard`;

  constructor(private http: HttpClient) {}

  obtenerDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}
