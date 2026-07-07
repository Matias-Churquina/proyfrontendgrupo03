import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClimaActual {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClimaService {
  constructor(private http: HttpClient) {}

  obtenerClima(latitud: number, longitud: number): Observable<ClimaActual> {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitud}` +
      `&longitude=${longitud}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=America%2FArgentina%2FJujuy';

    return this.http.get<ClimaActual>(url);
  }
}
