import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MapaUbicacion } from '../../components/mapa-ubicacion/mapa-ubicacion';
import { ChoferService } from '../../services/chofer.service';
import { GeolocationService, Coordenadas } from '../../services/geolocation.service';
import { SesionService, UsuarioSesion } from '../../services/sesion.service';

@Component({
  selector: 'app-chofer',
  imports: [FormsModule, MapaUbicacion],
  templateUrl: './chofer.html',
  styleUrl: './chofer.css',
})
export class ChoferPage {
  usuario: UsuarioSesion | null = null;

  latitud?: number;
  longitud?: number;
  precision?: number;

  latitudManual = -24.3831;
  longitudManual = -65.1183;

  cargando = false;
  mensaje = '';
  error = '';

  constructor(
    private sesionService: SesionService,
    private geolocationService: GeolocationService,
    private choferService: ChoferService,
    private router: Router
  ) {
    this.usuario = this.sesionService.obtenerUsuario();

    if (!this.usuario || this.usuario.rol !== 'CHOFER') {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarUltimaUbicacion();
  }

  cargarUltimaUbicacion(): void {
    if (!this.usuario?.idChofer) {
      return;
    }

    this.choferService.obtenerChofer(this.usuario.idChofer).subscribe({
      next: (chofer) => {
        if (chofer.latitud === null || chofer.latitud === undefined || chofer.longitud === null || chofer.longitud === undefined) {
          return;
        }

        this.latitud = Number(chofer.latitud);
        this.longitud = Number(chofer.longitud);
        this.precision = chofer.precision !== null && chofer.precision !== undefined ? Number(chofer.precision) : undefined;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  enviarUbicacion(): void {
    this.cargando = true;
    this.mensaje = '';
    this.error = '';

    if (!this.usuario?.idChofer) {
      this.error = 'No se encontro el id del chofer en la sesion.';
      this.cargando = false;
      return;
    }

    this.geolocationService
      .obtenerUbicacionActual()
      .then((ubicacion: Coordenadas) => {
        this.publicarUbicacion(ubicacion);
      })
      .catch((error) => {
        console.error(error);
        this.error = 'No se pudo obtener la ubicacion del dispositivo.';
        this.cargando = false;
      });
  }

  enviarUbicacionManual(): void {
    this.mensaje = '';
    this.error = '';

    if (!Number.isFinite(Number(this.latitudManual)) || !Number.isFinite(Number(this.longitudManual))) {
      this.error = 'Ingrese latitud y longitud validas.';
      return;
    }

    this.cargando = true;
    this.publicarUbicacion({
      latitud: Number(this.latitudManual),
      longitud: Number(this.longitudManual),
      precision: 0,
    });
  }

  private publicarUbicacion(ubicacion: Coordenadas): void {
    if (!this.usuario?.idChofer) {
      this.error = 'No se encontro el id del chofer en la sesion.';
      this.cargando = false;
      return;
    }

    this.latitud = ubicacion.latitud;
    this.longitud = ubicacion.longitud;
    this.precision = ubicacion.precision;

    this.choferService.actualizarUbicacion(this.usuario.idChofer, ubicacion).subscribe({
      next: () => {
        this.mensaje = 'Ubicacion enviada correctamente.';
        this.cargando = false;
      },
      error: (error) => {
        console.error(error);
        this.error = error.name === 'TimeoutError'
          ? 'El backend no respondio a tiempo al guardar la ubicacion.'
          : error.error?.msg || 'Error enviando ubicacion al backend.';
        this.cargando = false;
      },
    });
  }

  cerrarSesion(): void {
    this.sesionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
