import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasajeroService, CrearReservaDto } from '../../services/pasajero.service';
import { RutaService } from '../../services/ruta.service';
import { Pasajero } from '../../../models/pasajero.model';
import { Viaje } from '../../../models/viaje.model';
import { Reserva } from '../../../models/reserva.model';
import { MapaRutaComponent, PuntoMapa } from '../../components/mapa-ruta/mapa-ruta';

type ViajeCard = Viaje & {
  idChofer?: number;
  idAuto?: number;
  chofer?: any;
  auto?: any;
  reservas?: any[];
};

type ReservaHistorial = Reserva & {
  viaje?: ViajeCard;
};

@Component({
  selector: 'app-pasajero',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaRutaComponent],
  templateUrl: './pasajero.html',
  styleUrl: './pasajero.scss'
})
export class PasajeroComponent implements OnInit {
  public pasajero?: Pasajero;
  public viajesDisponibles: ViajeCard[] = [];
  public historial: ReservaHistorial[] = [];
  public reservaActiva?: ReservaHistorial;

  public ciudades = ['San Salvador de Jujuy', 'Perico'];
  public origen = 'Perico';
  public destino = 'San Salvador de Jujuy';
  public cantidadAsientos = 1;

  public mostrarHistorial = false;
  public buscando = false;
  public mensaje = '';

  public puntoChofer?: PuntoMapa;
  public puntoPasajero?: PuntoMapa;
  public rutaGeoJson?: GeoJSON.LineString;

  public idPasajero =
    Number(sessionStorage.getItem('idPasajero')) ||
    this.getIdPasajeroSesion() ||
    1;

  constructor(
    private _pasajeroService: PasajeroService,
    private _rutaService: RutaService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPasajero();
    this.buscarViajes();
  }

  loadPasajero(): void {
    this._pasajeroService.getPasajeroById(this.idPasajero).subscribe({
      next: (data: any) => {
        this.pasajero = data;

        this.reservaActiva = data.reservas?.find((reserva: ReservaHistorial) =>
          reserva.estadoReserva === 'PENDIENTE' ||
          reserva.estadoReserva === 'CONFIRMADA'
        );

        this.sincronizarPuntoChoferDesdeReserva();
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => console.error('Error al cargar pasajero:', err)
    });
  }

  buscarViajes(silencioso = false): void {
    if (this.origen === this.destino) {
      this.mensaje = 'El origen y el destino no pueden ser iguales.';
      return;
    }

    if (!silencioso) {
      this.buscando = true;
      this.mensaje = '';
    }

    this._pasajeroService.getViajesDisponibles(this.origen, this.destino).subscribe({
      next: (data) => {
        this.viajesDisponibles = data as ViajeCard[];
        this.buscando = false;
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        this.buscando = false;

        if (!silencioso) {
          this.mensaje = 'No se pudieron cargar los viajes disponibles.';
        }

        console.error('Error al buscar viajes:', err);
      }
    });
  }

  seleccionarViaje(viaje: ViajeCard): void {
    if (this.reservaActiva) {
      this.mensaje = 'Ya tenes una reserva activa. Cancelala o finalizala antes de reservar otro viaje.';
      return;
    }

    if (this.cantidadAsientos > viaje.asientosDisponibles) {
      this.mensaje = 'No hay suficientes asientos disponibles.';
      return;
    }

    const reserva: CrearReservaDto = {
      idPasajero: this.idPasajero,
      idViaje: viaje.idViaje,
      cantidadAsientos: this.cantidadAsientos,
      importeTotal: Number(viaje.tarifaPorAsiento) * this.cantidadAsientos,
      estadoReserva: 'CONFIRMADA',
      estadoPago: 'PENDIENTE'
    };

    this._pasajeroService.crearReserva(reserva, 'LINK').subscribe({
      next: (response) => {
        const nuevosAsientos = viaje.asientosDisponibles - this.cantidadAsientos;

        this._pasajeroService.actualizarAsientosDisponibles(viaje.idViaje, nuevosAsientos).subscribe({
          next: () => {
            this.mensaje = 'Reserva creada. Redirigiendo a Mercado Pago...';
            this.loadPasajero();
            this.buscarViajes();

            if (response.url_pago) {
              window.open(response.url_pago, '_blank');
            }
          }
        });
      },
      error: (err) => {
        this.mensaje = 'No se pudo crear el pago.';
        console.error(err);
      }
    });
  }

  pagarEnEfectivo(viaje: ViajeCard): void {
    if (this.reservaActiva) {
      this.mensaje = 'Ya tenes una reserva activa.';
      return;
    }

    if (this.cantidadAsientos > viaje.asientosDisponibles) {
      this.mensaje = 'No hay suficientes asientos disponibles.';
      return;
    }

    const reserva: CrearReservaDto = {
      idPasajero: this.idPasajero,
      idViaje: viaje.idViaje,
      cantidadAsientos: this.cantidadAsientos,
      importeTotal: Number(viaje.tarifaPorAsiento) * this.cantidadAsientos,
      estadoReserva: 'CONFIRMADA',
      estadoPago: 'PENDIENTE'
    };

    this._pasajeroService.crearReserva(reserva, 'EFECTIVO' as any).subscribe({
      next: () => {
        const nuevosAsientos = viaje.asientosDisponibles - this.cantidadAsientos;

        this._pasajeroService.actualizarAsientosDisponibles(viaje.idViaje, nuevosAsientos).subscribe({
          next: () => {
            this.mensaje = 'Reserva confirmada. El pago queda pendiente en efectivo.';
            this.loadPasajero();
            this.buscarViajes();
          }
        });
      },
      error: (err) => {
        this.mensaje = 'No se pudo confirmar la reserva en efectivo.';
        console.error(err);
      }
    });
  }

  verHistorial(): void {
    this.mostrarHistorial = !this.mostrarHistorial;

    if (!this.mostrarHistorial) return;

    this._pasajeroService.getHistorialPasajero(this.idPasajero).subscribe({
      next: (data) => {
        this.historial = data as ReservaHistorial[];
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => console.error('Error al cargar historial:', err)
    });
  }

  volverAViajesDisponibles(): void {
    this.mostrarHistorial = false;
    this.buscarViajes();
  }

  abrirConfiguracion(): void {
    this.mensaje = 'Configuracion pendiente de implementar.';
  }

  actualizarUbicacionChofer(): void {
    const idChofer = this.reservaActiva?.viaje?.idChofer || this.reservaActiva?.viaje?.chofer?.idChofer;

    if (!idChofer) {
      this.mensaje = 'No se encontro el chofer de la reserva activa.';
      return;
    }

    this._pasajeroService.getChoferById(idChofer).subscribe({
      next: (chofer: any) => {
        if (chofer.latitud === null || chofer.latitud === undefined || chofer.longitud === null || chofer.longitud === undefined) {
          this.mensaje = 'El chofer todavia no compartio su ubicacion.';
          return;
        }

        this.puntoChofer = {
          latitud: Number(chofer.latitud),
          longitud: Number(chofer.longitud),
          etiqueta: 'Chofer',
          tipo: 'chofer'
        };

        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        this.mensaje = 'No se pudo actualizar la ubicacion del chofer.';
        console.error(err);
      }
    });
  }

  comoLlegarAlChofer(): void {
    if (!this.puntoChofer) {
      this.actualizarUbicacionChofer();
      this.mensaje = 'Primero actualiza la ubicacion del chofer.';
      return;
    }

    if (!navigator.geolocation) {
      this.mensaje = 'Tu navegador no permite obtener tu ubicacion.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.puntoPasajero = {
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          etiqueta: 'Tu ubicacion',
          tipo: 'pasajero'
        };

        this._rutaService.obtenerRuta(this.puntoPasajero, this.puntoChofer!).subscribe({
          next: (response) => {
            this.rutaGeoJson = response.routes?.[0]?.geometry;
            this._changeDetectorRef.detectChanges();
          },
          error: (err) => {
            this.mensaje = 'No se pudo calcular la ruta.';
            console.error(err);
          }
        });
      },
      (err) => {
        this.mensaje = 'No se pudo obtener tu ubicacion actual.';
        console.error(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  }

  getNombreChofer(viaje: ViajeCard): string {
    const usuario = viaje.chofer?.usuario;

    if (usuario) {
      return `${usuario.nombre} ${usuario.apellido}`;
    }

    return `Chofer #${viaje.idChofer || viaje.chofer?.idChofer || '-'}`;
  }

  getAsientos(viaje: ViajeCard): number[] {
    const capacidad = viaje.auto?.capacidadAsientos || 4;
    return Array.from({ length: capacidad }, (_, index) => index + 1);
  }

  getAsientosOcupados(viaje: ViajeCard): number {
    const capacidad = viaje.auto?.capacidadAsientos || 4;
    return capacidad - viaje.asientosDisponibles;
  }

  private sincronizarPuntoChoferDesdeReserva(): void {
    const chofer = this.reservaActiva?.viaje?.chofer;

    if (!chofer?.latitud || !chofer?.longitud) {
      this.puntoChofer = undefined;
      this.rutaGeoJson = undefined;
      return;
    }

    this.puntoChofer = {
      latitud: Number(chofer.latitud),
      longitud: Number(chofer.longitud),
      etiqueta: 'Chofer',
      tipo: 'chofer'
    };
  }

  private getIdPasajeroSesion(): number {
    const sesion = sessionStorage.getItem('usuario_perico');

    if (!sesion) return 0;

    const usuario = JSON.parse(sesion);
    return Number(usuario.idPasajero) || 0;
  }
}