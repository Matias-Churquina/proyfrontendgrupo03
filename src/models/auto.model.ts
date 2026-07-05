import type { Chofer } from './chofer.model';
import type { Viaje } from './viaje.model';

export interface Auto {
  idAuto: number;
  patente: string;
  marca: string;
  modelo: string;
  capacidadAsientos: number;
  estado: 'DISPONIBLE' | 'EN_VIAJE' | 'EN_TALLER' | 'INACTIVO';
  createdAt?: string;
  updatedAt?: string;
  choferes?: Chofer[];
  viajes?: Viaje[];
}

export type CrearAutoDTO = Omit<Auto, 'idAuto' | 'createdAt' | 'updatedAt' | 'choferes' | 'viajes'>;
