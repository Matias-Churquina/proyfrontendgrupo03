import type { Auto } from './auto.model';
import type { Chofer } from './chofer.model';
import type { Reserva } from './reserva.model';

export type Decimal = number | string;

export interface Viaje {
  idViaje: number;
  origen: string;
  destino: string;
  fechaSalida: string;
  horaSalida: string;
  tarifaPorAsiento: Decimal;
  asientosDisponibles: number;
  estadoViaje: 'ABIERTO' | 'COMPLETO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';
  idChofer?: number;
  idAuto?: number;
  createdAt?: string;
  updatedAt?: string;
  chofer?: Chofer;
  auto?: Auto;
  reservas?: Reserva[];
}

export type CrearViajeDTO = Omit<Viaje, 'idViaje' | 'asientosDisponibles' | 'estadoViaje' | 'createdAt' | 'updatedAt' | 'chofer' | 'auto' | 'reservas'>;
