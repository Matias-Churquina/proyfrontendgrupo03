import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChoferModel } from '../../models/chofer.model';
import { Auto } from '../../models/auto.model';
import { Viaje } from '../../models/viaje.model';

export interface CrearViajeDto {
  origen: string;
  destino: string;
  fechaSalida: string;
  horaSalida: string;
  tarifaPorAsiento: number;
  idChofer: number;
  idAuto: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChoferService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private _http: HttpClient) {}

  getChoferById(idChofer: number): Observable<ChoferModel> {
    return this._http.get<ChoferModel>(`${this.baseUrl}/choferes/${idChofer}`);
  }

  updateEstadoChofer(idChofer: number, estadoChofer: string): Observable<any> {
    return this._http.patch<any>(`${this.baseUrl}/choferes/${idChofer}/estado`, {
      estadoChofer
    });
  }

  getAutosByChofer(idChofer: number): Observable<Auto[]> {
    return this._http.get<Auto[]>(`${this.baseUrl}/choferes/${idChofer}/autos`);
  }

  getViajesDelChofer(idChofer: number): Observable<Viaje[]> {
    return this._http.get<Viaje[]>(`${this.baseUrl}/choferes/${idChofer}/viajes`);
  }

  crearViaje(nuevoViaje: CrearViajeDto): Observable<any> {
    return this._http.post<any>(`${this.baseUrl}/viajes`, nuevoViaje);
  }

  cambiarEstadoViaje(idViaje: number, estado: string): Observable<any> {
    return this._http.patch<any>(`${this.baseUrl}/viajes/${idViaje}/estado`, {
      estado
    });
  }

  actualizarAsientosDisponibles(idViaje: number, asientosDisponibles: number): Observable<Viaje> {
    return this._http.post<Viaje>(`${this.baseUrl}/viajes/${idViaje}/actualizar-asientos-disponibles`, {
      asientosDisponibles
    });
  }
}