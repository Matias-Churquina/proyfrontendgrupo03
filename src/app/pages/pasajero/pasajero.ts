import { Component, ChangeDetectorRef, OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasajeroService, CrearReservaDto } from '../../services/pasajero.service';
import { Pasajero } from '../../../models/pasajero.model';
import { Viaje } from '../../../models/viaje.model';
import { Reserva } from '../../../models/reserva.model';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './pasajero.html',
  styleUrl: './pasajero.scss'
})
export class PasajeroComponent implements OnInit, OnDestroy {
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

  private refreshTimer?: ReturnType<typeof setInterval>;

  public idPasajero = Number(sessionStorage.getItem('idPasajero')) || this.getIdPasajeroSesion() || 1;

  constructor(
    private _pasajeroService: PasajeroService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPasajero();
    this.buscarViajes();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    this._changeDetectorRef.detach();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  loadPasajero(): void {
    this._pasajeroService.getPasajeroById(this.idPasajero).subscribe({
      next: (data: any) => {
        this.pasajero = data;
        this.reservaActiva = data.reservas?.find((reserva: ReservaHistorial) =>
          reserva.estadoReserva === 'PENDIENTE' || reserva.estadoReserva === 'CONFIRMADA'
        );
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
      this.mensaje = 'Ya tenés una reserva activa. Cancelala o finalizala antes de reservar otro viaje.';
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

  private iniciarActualizacionAutomatica(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.mostrarHistorial) {
        this.loadPasajero();
        this.buscarViajes(true);
      }
    }, 8000);
  }

  abrirConfiguracion(): void {
    this.mensaje = 'Configuración pendiente de implementar.';
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

  private getIdPasajeroSesion(): number {
    const sesion = sessionStorage.getItem('usuario_perico');

    if (!sesion) return 0;

    const usuario = JSON.parse(sesion);
    return Number(usuario.idPasajero) || 0;
  }
}