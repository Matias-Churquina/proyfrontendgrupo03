import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import { Coordenadas } from './geolocation.service';
import type { Pasajero } from '../../models/pasajero.model';

@Injectable({
  providedIn: 'root',
})
export class PasajeroService {
  private readonly url = `${API_URL}/pasajeros`;

  constructor(private http: HttpClient) {}

  obtenerPasajeros(): Observable<Pasajero[]> {
    return this.http.get<Pasajero[]>(this.url);
  }

  obtenerPasajero(idPasajero: number): Observable<Pasajero> {
    return this.http.get<Pasajero>(`${this.url}/${idPasajero}`);
  }

  actualizarUbicacion(idPasajero: number, ubicacion: Coordenadas): Observable<{ status: string; msg: string; pasajero: Pasajero }> {
    return this.http.patch<{ status: string; msg: string; pasajero: Pasajero }>(`${this.url}/${idPasajero}/ubicacion`, ubicacion);
  }
}
