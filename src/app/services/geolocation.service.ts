import { Injectable } from '@angular/core';

export interface Coordenadas {
  latitud: number;
  longitud: number;
  precision?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  obtenerUbicacionActual(): Promise<Coordenadas> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('El navegador no soporta geolocalizacion'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            precision: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  observarUbicacion(
    callback: (coordenadas: Coordenadas) => void,
    errorCallback?: (error: GeolocationPositionError) => void
  ): number {
    if (!navigator.geolocation) {
      throw new Error('El navegador no soporta geolocalizacion');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precision: position.coords.accuracy,
        });
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  detenerObservacion(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }
}
