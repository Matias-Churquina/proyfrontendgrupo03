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
import { SocketService } from '../../services/socket.service';
import { ToastrService } from 'ngx-toastr';

type AutoBack = Auto & {
  estado?: 'DISPONIBLE' | 'EN_VIAJE' | 'EN_TALLER' | 'INACTIVO';
};

type ViajeBack = Viaje & {
  idChofer?: number;
  idAuto?: number;
  auto?: AutoBack;
  reservas?: any[];
  asientosDisponibles?: number;
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
  private modalConfirmacion?: bootstrap.Modal;
  public qrCobro?: string;

  public latitud?: number;
  public longitud?: number;
  public precision?: number;
  public puntoChofer?: PuntoMapa;
  public mensajeUbicacion = '';
  public errorUbicacion = '';
  public cargandoUbicacion = false;

  private eventosEscuchados = new Set<string>();

  constructor(
    private _choferService: ChoferService,
    private _geolocationService: GeolocationService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _socketService: SocketService,
    private _toastr: ToastrService
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
    const modalAgregar = document.getElementById('modalAgregarPasajero');

    if (modalAgregar) {
      this.modalAgregarPasajero = new bootstrap.Modal(modalAgregar);
    }

    const modalConfirmacion = document.getElementById('modalConfirmacionAccion');

    if (modalConfirmacion) {
      this.modalConfirmacion = new bootstrap.Modal(modalConfirmacion);
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

        this.registrarEventosDeViajeActual();
        this.registrarEventosDeReservasDelViaje();

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

  get textoAccionCierreViaje(): string {
    if (this.viajeActual?.estadoViaje === 'EN_CURSO') {
      return 'Finalizar viaje';
    }

    return 'Cancelar viaje';
  }

  get iconoAccionCierreViaje(): string {
    if (this.viajeActual?.estadoViaje === 'EN_CURSO') {
      return 'bi-stop-circle';
    }

    return 'bi-x-circle';
  }

  get claseAccionCierreViaje(): string {
    if (this.viajeActual?.estadoViaje === 'EN_CURSO') {
      return 'btn-outline-dark';
    }

    return 'btn-outline-danger';
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

    if (this.viajeActual.estadoViaje !== 'ABIERTO') {
      this._toastr.warning('Solo se puede iniciar un viaje abierto.');
      return;
    }

    this.abrirModalConfirmacion({
      titulo: 'Iniciar viaje',
      mensaje: '¿Seguro que queres iniciar este viaje? A partir de este momento el viaje quedará en curso.',
      textoConfirmar: 'Iniciar viaje',
      icono: 'bi-play-fill',
      variante: 'primary',
      accion: () => this.confirmarInicioViaje()
    });
  }

  finalizarViaje(): void {
    if (!this.viajeActual) return;

    const estaEnCurso = this.viajeActual.estadoViaje === 'EN_CURSO';

    if (estaEnCurso) {
      this.abrirModalConfirmacion({
        titulo: 'Finalizar viaje',
        mensaje: '¿Seguro que queres finalizar este viaje? Esta acción marcará el viaje como completado.',
        textoConfirmar: 'Finalizar viaje',
        icono: 'bi-stop-circle',
        variante: 'dark',
        accion: () => this.confirmarCambioEstadoViaje('FINALIZADO')
      });

      return;
    }

    this.abrirModalConfirmacion({
      titulo: 'Cancelar viaje',
      mensaje: '¿Seguro que queres cancelar este viaje? El viaje dejará de estar disponible para pasajeros.',
      textoConfirmar: 'Cancelar viaje',
      icono: 'bi-x-circle',
      variante: 'danger',
      accion: () => this.confirmarCambioEstadoViaje('CANCELADO')
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

  public confirmacionModal: ConfirmacionModal = {
    titulo: '',
    mensaje: '',
    textoConfirmar: '',
    icono: 'bi-question-circle',
    variante: 'primary',
    accion: null
  };

  abrirModalConfirmacion(config: ConfirmacionModal): void {
    this.confirmacionModal = config;
    this.modalConfirmacion?.show();
  }

  private confirmarInicioViaje(): void {
    if (!this.viajeActual) return;

    this._choferService.cambiarEstadoViaje(
      this.viajeActual.idViaje,
      'EN_CURSO'
    ).subscribe({
      next: () => {
        this._toastr.success('Viaje iniciado correctamente.');
        this.loadViajes();
      },
      error: (err) => {
        this._toastr.error('Error al iniciar viaje.');
        console.error('Error al iniciar viaje:', err);
      }
    });
  }

  confirmarAccionModal(): void {
    const accion = this.confirmacionModal.accion;

    this.modalConfirmacion?.hide();

    if (accion) {
      accion();
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

  private confirmarCambioEstadoViaje(nuevoEstado: 'FINALIZADO' | 'CANCELADO'): void {
    if (!this.viajeActual) return;

    const accionTexto = nuevoEstado === 'FINALIZADO' ? 'finalizar' : 'cancelar';

    this._choferService.cambiarEstadoViaje(
      this.viajeActual.idViaje,
      nuevoEstado
    ).subscribe({
      next: () => {
        if (nuevoEstado === 'FINALIZADO') {
          this._toastr.success('Viaje finalizado correctamente.');
        } else {
          this._toastr.warning('Viaje cancelado correctamente.');
        }

        this.loadViajes();
      },
      error: (err) => {
        this._toastr.error(`No se pudo ${accionTexto} el viaje.`);
        console.error(`Error al ${accionTexto} viaje:`, err);
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
    const sesion = sessionStorage.getItem('usuarioSesion');

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

  private escucharEvento<T>(evento: string, callback: (data: T) => void): void {
    if (this.eventosEscuchados.has(evento)) return;

    this.eventosEscuchados.add(evento);
    this._socketService.escuchar<T>(evento, callback);
  }

  private registrarEventosDeViajeActual(): void {
    const idViaje = this.viajeActual?.idViaje;

    if (!idViaje) return;

    this.escucharEvento<any>(`reserva_creada_viaje_${idViaje}`, (data) => {
      this.loadViajes();
    });

    this.escucharEvento<any>(`pago_actualizado_viaje_${idViaje}`, (data) => {
      this.mensajeUbicacion = 'Se actualizo el pago de una reserva.';
      this.loadViajes();
    });

    this.escucharEvento<any>(`asientos_actualizados_viaje_${idViaje}`, (data) => {
      if (!this.viajeActual) return;

      if (this.viajeActual.idViaje === data.idViaje) {
        this.viajeActual.asientosDisponibles = data.asientosDisponibles;
        this._toastr.info('Los asientos disponibles del viaje fueron actualizados.');
        this.loadViajes();
      }
    });

    this.escucharEvento<any>(`viaje_actualizado_${idViaje}`, (data) => {
      if (!this.viajeActual) return;

      if (this.viajeActual.idViaje === data.idViaje) {
        this.viajeActual.estadoViaje = data.estadoViaje;
        this._changeDetectorRef.detectChanges();
      }

      this.loadViajes();
    });
  }

  private registrarEventosDeReservasDelViaje(): void {
    const reservas = this.viajeActual?.reservas || [];

    reservas.forEach((reserva) => {
      this.escucharEvento<any>(`pago_confirmado_reserva_${reserva.idReserva}`, (data) => {
        reserva.estadoPago = data.estadoPago;
        reserva.estadoReserva = data.estadoReserva;

        this.mensajeUbicacion = `Pago confirmado de la reserva #${data.idReserva}.`;
        this._changeDetectorRef.detectChanges();
      });

      this.escucharEvento<any>(`qr_generado_reserva_${reserva.idReserva}`, (data) => {
        if (data.qr_data) {
          this.qrCobro = data.qr_data;
        }

        this._changeDetectorRef.detectChanges();
      });

      this.escucharEvento<any>(`reserva_cancelada_${reserva.idReserva}`, (data) => {
        this._toastr.warning(`La reserva #${data.idReserva} fue cancelada.`);
        this.loadViajes();
      });
    });
  }
}

type ConfirmacionModal = {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  icono: string;
  variante: 'primary' | 'danger' | 'dark' | 'warning';
  accion: (() => void) | null;
};