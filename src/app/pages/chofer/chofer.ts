import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoferService, CrearViajeDto } from '../../services/chofer.service';
import { ChoferModel } from '../../../models/chofer.model';
import { Auto } from '../../../models/auto.model';
import { Viaje } from '../../../models/viaje.model';
import { Reserva } from '../../../models/reserva.model';
import * as bootstrap from 'bootstrap';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './chofer.html',
  styleUrl: './chofer.scss'
})
export class Chofer {
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

  constructor(
    private _choferService: ChoferService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.idChofer) {
      console.error('No hay idChofer en sesión');
      return;
    }

    this.loadChofer();
    this.loadAutos();
    this.loadViajes();
  }

  loadChofer(): void {
    this._choferService.getChoferById(this.idChofer).subscribe({
      next: (data) => {
        this.chofer = data;
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

  private getIdChoferSesion(): number {
    const sesion = sessionStorage.getItem('usuario_perico');

    if (!sesion) return 0;

    const usuario = JSON.parse(sesion);
    return Number(usuario.idChofer) || 0;
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

  cobrarConQr(reserva: any): void {
    if (reserva.estadoPago === 'PAGADO') return;

    this._choferService.generarQrCobro(reserva.idReserva).subscribe({
      next: (response) => {
        this.qrCobro = response.qr_data;
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error al generar QR:', err);
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

  ngAfterViewInit(): void {
    const modal = document.getElementById('modalAgregarPasajero');

    if (modal) {
      this.modalAgregarPasajero = new bootstrap.Modal(modal);
    }
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
      next: (response: any) => {
        this.loadViajes();
        (document.activeElement as HTMLElement)?.blur();
        this.modalAgregarPasajero.hide();
      },
      error: err => {
        console.error(err);
      }
    });
  }

  toggleHistorial(): void {
    this.mostrarHistorial = !this.mostrarHistorial;
  }

  getEstadoAuto(): string {
    return this.autoAsignado?.estado || this.autoAsignado?.estadoAuto || 'SIN AUTO';
  }

  private getFechaActual(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getHoraActual(): string {
    return new Date().toTimeString().slice(0, 8);
  }
}