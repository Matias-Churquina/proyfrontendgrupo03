import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroPasajeroDTO {
  nombre: string;
  apellido: string;
  email: string;
  passwordHash: string;
  telefono: string;
}

export interface RegistroChoferDTO {
  nombre: string;
  apellido: string;
  email: string;
  passwordHash: string;
  telefono: string;
  licenciaConducir: string;
  fechaHabilitacion: string;
}

@Service()
export class RegistroService {
  private http = inject(HttpClient); 
  
  private apiUrl = 'http://localhost:3000/api';

  registrarPasajero(data: RegistroPasajeroDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/pasajeros`, data);
  }

  registrarChofer(data: RegistroChoferDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/choferes`, data);
  }
}