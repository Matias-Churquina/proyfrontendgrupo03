import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { API_URL } from '../config/api.config';
import { Coordenadas } from './geolocation.service';
import type { Chofer } from '../../models/chofer.model';

@Injectable({
  providedIn: 'root',
})
export class ChoferService {
  private readonly url = `${API_URL}/choferes`;

  constructor(private http: HttpClient) {}

  obtenerChoferes(): Observable<Chofer[]> {
    return this.http.get<Chofer[]>(this.url).pipe(timeout(10000));
  }

  obtenerChofer(idChofer: number): Observable<Chofer> {
    return this.http.get<Chofer>(`${this.url}/${idChofer}`).pipe(timeout(10000));
  }

  actualizarUbicacion(idChofer: number, ubicacion: Coordenadas): Observable<{ status: string; msg: string; chofer: Chofer }> {
    return this.http.patch<{ status: string; msg: string; chofer: Chofer }>(`${this.url}/${idChofer}/ubicacion`, ubicacion).pipe(timeout(10000));
  }
}
