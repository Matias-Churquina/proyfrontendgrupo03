import type { Pasajero } from './pasajero.model';
import type { Viaje } from './viaje.model';

export type Decimal = number | string;

export interface Reserva {
  idReserva: number;
  idPasajero: number;
  idViaje: number;
  cantidadAsientos: number;
  importeTotal: Decimal;
  estadoReserva: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'UTILIZADA' | 'NO_PRESENTADO'; 
  estadoPago: 'PENDIENTE' | 'PAGADO' | 'REEMBOLSADO';
  createdAt?: string;
  updatedAt?: string;
  pasajero?: Pasajero;
  viaje?: Viaje;
}

export type CrearReservaDTO = Omit<Reserva, 'idReserva' | 'estadoReserva' | 'estadoPago' | 'createdAt' | 'updatedAt' | 'pasajero' | 'viaje'>;
