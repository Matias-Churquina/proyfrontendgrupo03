import { Usuario } from './usuario.model';


export interface Pasajero {
  idPasajero: number;
  idUsuario: number;
  calificacion: number;
  cantidadReservas: number;
  estadoPasajero: 'ACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO';
  usuario: Usuario;
}