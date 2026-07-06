import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoferService, Coordenadas, CrearViajeDto } from '../../services/chofer.service';
import { ChoferModel } from '../../../models/chofer.model';
import { Auto } from '../../../models/auto.model';
import { Viaje } from '../../../models/viaje.model';
import { Reserva } from '../../../models/reserva.model';
import * as bootstrap from 'bootstrap';
import { GeolocationService } from '../../services/geolocalizacion.service';
import { MapaRutaComponent, PuntoMapa } from '../../components/mapa-ruta/mapa-ruta';

type AutoBack = Auto & {
  estado?: 'DISPONIBLE' | 'EN_VIAJE' | 'EN_TALLER' | 'INACTIVO';
};

type ViajeBack = Viaje & {
  idChofer?: number;
  idAuto?: number;
  auto?: AutoBack;
  reservas?: any[];
};

@Component({
  selector: 'app-chofer',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaRutaComponent],
  templateUrl: './chofer.html',
  styleUrl: './chofer.scss'
})
export class Chofer implements OnInit {
  public chofer?: ChoferModel;
  public autos: AutoBack[] = [];
  public autoAsignado?: AutoBack;
  public viajeActual?: ViajeBack;
  public asientos = [1, 2, 3, 4];
  public viajesHistorial: ViajeBack[] = [];
  public mostrarHistorial = false;
  public reserva: Reserva | null = null;

  public ciudades = ['San Salvador de Jujuy', 'Perico'];
  public nuevoOrigen = 'San Salvador de Jujuy';
  public nuevoDestino = 'Perico';

  public idChofer = this.getIdChoferSesion();

  private modalAgregarPasajero!: bootstrap.Modal;
  public qrCobro?: string;

  public latitud?: number;
  public longitud?: number;
  public precision?: number;
  public puntoChofer?: PuntoMapa;
  public mensajeUbicacion = '';
  public errorUbicacion = '';
  public cargandoUbicacion = false;

  constructor(
    private _choferService: ChoferService,
    private _geolocationService: GeolocationService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.idChofer) {
      console.error('No hay idChofer en sesion');
      return;
    }

    this.loadChofer();
    this.loadAutos();
    this.loadViajes();
  }

  ngAfterViewInit(): void {
    const modal = document.getElementById('modalAgregarPasajero');

    if (modal) {
      this.modalAgregarPasajero = new bootstrap.Modal(modal);
    }
  }

  loadChofer(): void {
    this._choferService.getChoferById(this.idChofer).subscribe({
      next: (data) => {
        this.chofer = data;

        if (
          data.latitud !== null &&
          data.latitud !== undefined &&
          data.longitud !== null &&
          data.longitud !== undefined
        ) {
          this.latitud = Number(data.latitud);
          this.longitud = Number(data.longitud);
          this.precision =
            data.precision !== null && data.precision !== undefined
              ? Number(data.precision)
              : undefined;

          this.puntoChofer = {
            latitud: this.latitud,
            longitud: this.longitud,
            etiqueta: 'Mi ubicacion',
            tipo: 'chofer'
          };
        }

        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar chofer:', err);
      }
    });
  }

  loadAutos(): void {
    this._choferService.getAutosByChofer(this.idChofer).subscribe({
      next: (data) => {
        this.autos = data as AutoBack[];
        this.autoAsignado = this.autos[0];
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar autos del chofer:', err);
      }
    });
  }

  loadViajes(): void {
    this._choferService.getViajesDelChofer(this.idChofer).subscribe({
      next: (data) => {
        const viajes = data as ViajeBack[];

        this.viajeActual = viajes.find((viaje) =>
          viaje.estadoViaje === 'ABIERTO' || viaje.estadoViaje === 'EN_CURSO'
        );

        this.viajesHistorial = viajes.filter((viaje) =>
          viaje.estadoViaje === 'FINALIZADO' || viaje.estadoViaje === 'CANCELADO'
        );

        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar viajes del chofer:', err);
      }
    });
  }

  cambiarDisponibilidad(activo: boolean): void {
    const nuevoEstado = activo ? 'DISPONIBLE' : 'DESCANSO';

    this._choferService.updateEstadoChofer(this.idChofer, nuevoEstado).subscribe({
      next: (response) => {
        this.chofer = response.chofer || response;
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar estado del chofer:', err);
      }
    });
  }

  get puedeCrearViaje(): boolean {
    return (
      this.autoAsignado !== undefined &&
      this.nuevoOrigen !== this.nuevoDestino &&
      !this.viajeActual
    );
  }

  crearNuevoViaje(): void {
    if (!this.autoAsignado) {
      console.error('No hay auto asignado para crear el viaje');
      return;
    }

    if (this.nuevoOrigen === this.nuevoDestino) {
      console.error('El origen y destino no pueden ser iguales');
      return;
    }

    const nuevoViaje: CrearViajeDto = {
      origen: this.nuevoOrigen,
      destino: this.nuevoDestino,
      fechaSalida: this.getFechaActual(),
      horaSalida: this.getHoraActual(),
      tarifaPorAsiento: 1000,
      idChofer: this.idChofer,
      idAuto: this.autoAsignado.idAuto
    };

    this._choferService.crearViaje(nuevoViaje).subscribe({
      next: () => {
        this.loadViajes();
        this.loadChofer();
      },
      error: (err) => {
        console.error('Error al crear nuevo viaje:', err);
      }
    });
  }

  iniciarViaje(): void {
    if (!this.viajeActual) return;

    this._choferService.cambiarEstadoViaje(this.viajeActual.idViaje, 'EN_CURSO').subscribe({
      next: () => {
        this.loadViajes();
      },
      error: (err) => {
        console.error('Error al iniciar viaje:', err);
      }
    });
  }

  finalizarViaje(): void {
    if (!this.viajeActual) return;

    this._choferService.cambiarEstadoViaje(this.viajeActual.idViaje, 'FINALIZADO').subscribe({
      next: () => {
        this.loadViajes();
      },
      error: (err) => {
        console.error('Error al finalizar viaje:', err);
      }
    });
  }

  cobrarConQr(reserva: any): void {
    if (reserva.estadoPago === 'PAGADO') return;

    this._choferService.generarQrCobro(reserva.idReserva).subscribe({
      next: (response) => {
        this.qrCobro = response.qr_data;
      },
      error: (err) => {
        console.error('Error al generar QR:', err);
      }
    });
  }

  registrarPagoEfectivo(reserva: any): void {
    if (reserva.estadoPago === 'PAGADO') return;

    this._choferService.registrarPagoEfectivo(reserva.idReserva).subscribe({
      next: () => {
        reserva.estadoPago = 'PAGADO';
        this.loadViajes();
      },
      error: (err) => {
        console.error('Error al registrar pago en efectivo:', err);
      }
    });
  }

  abrirModalAgregarPasajero(): void {
    if (!this.viajeActual) {
      console.error('No hay viaje actual para agregar pasajero');
      return;
    }

    if (this.viajeActual.asientosDisponibles > 0) {
      this.modalAgregarPasajero.show();
    } else {
      console.error('No hay asientos disponibles para agregar pasajero');
    }
  }

  confirmarAgregarPasajero(): void {
    if (!this.viajeActual || this.viajeActual.asientosDisponibles <= 0) {
      return;
    }

    const nuevosAsientos = this.viajeActual.asientosDisponibles - 1;

    this._choferService.actualizarAsientosDisponibles(
      this.viajeActual.idViaje,
      nuevosAsientos
    ).subscribe({
      next: () => {
        this.loadViajes();
        (document.activeElement as HTMLElement)?.blur();
        this.modalAgregarPasajero.hide();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  agregarPasajeroManual(): void {
    if (!this.viajeActual || this.viajeActual.asientosDisponibles <= 0) {
      console.error('No hay asientos disponibles para agregar pasajero');
      return;
    }

    const nuevosAsientos = this.viajeActual.asientosDisponibles - 1;

    this._choferService.actualizarAsientosDisponibles(
      this.viajeActual.idViaje,
      nuevosAsientos
    ).subscribe({
      next: (response: any) => {
        this.viajeActual = response.viaje || response;
        this._changeDetectorRef.detectChanges();
        console.log('Asiento agregado, viaje actualizado:', this.viajeActual);
      },
      error: (err) => {
        console.error('Error al agregar pasajero:', err);
      }
    });
  }

  enviarUbicacion(): void {
    this.cargandoUbicacion = true;
    this.mensajeUbicacion = '';
    this.errorUbicacion = '';

    this._geolocationService.obtenerUbicacionActual()
      .then((ubicacion) => {
        this.publicarUbicacion(ubicacion);
      })
      .catch((error) => {
        console.error(error);
        this.errorUbicacion = 'No se pudo obtener la ubicacion del dispositivo.';
        this.cargandoUbicacion = false;
        this._changeDetectorRef.detectChanges();
      });
  }

  private publicarUbicacion(ubicacion: Coordenadas): void {
    this.latitud = ubicacion.latitud;
    this.longitud = ubicacion.longitud;
    this.precision = ubicacion.precision;

    this.puntoChofer = {
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
      etiqueta: 'Mi ubicacion',
      tipo: 'chofer'
    };

    this._choferService.actualizarUbicacion(this.idChofer, ubicacion).subscribe({
      next: () => {
        this.mensajeUbicacion = 'Ubicacion enviada correctamente.';
        this.cargandoUbicacion = false;
        this._changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.errorUbicacion = error.error?.msg || 'Error enviando ubicacion al backend.';
        this.cargandoUbicacion = false;
        this._changeDetectorRef.detectChanges();
      }
    });
  }

  toggleHistorial(): void {
    this.mostrarHistorial = !this.mostrarHistorial;
  }

  getEstadoAuto(): string {
    return this.autoAsignado?.estado || this.autoAsignado?.estadoAuto || 'SIN AUTO';
  }

  private getIdChoferSesion(): number {
    const sesion = sessionStorage.getItem('usuario_perico');

    if (!sesion) return 0;

    const usuario = JSON.parse(sesion);
    return Number(usuario.idChofer) || 0;
  }

  private getFechaActual(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getHoraActual(): string {
    return new Date().toTimeString().slice(0, 8);
  }
}