import { Usuario } from './usuario.model';

export interface ChoferModel {
  idChofer: number;
  idUsuario: number;
  licenciaConducir: string;
  estadoChofer: 'DISPONIBLE' | 'EN_VIAJE' | 'DESCANSO' | 'SUSPENDIDO' | 'INACTIVO';
  fechaHabilitacion: string; 
  calificacion: number;
  usuario: Usuario;
}