import type { Auto } from './auto.model';
import type { Chofer } from './chofer.model';

export interface TurnoChofer {
  idTurnoChofer: number;
  idChofer: number;
  idAuto: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  createdAt?: string;
  updatedAt?: string;
  chofer?: Chofer;
  auto?: Auto;
}

export type CrearTurnoChoferDTO = Omit<TurnoChofer, 'idTurnoChofer' | 'createdAt' | 'updatedAt' | 'chofer' | 'auto'>;
