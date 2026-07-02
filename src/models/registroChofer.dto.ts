export interface RegistroChoferDTO {
  // datos del usuario
  nombre: string;
  apellido: string;
  email: string;
  passwordHash: string;
  telefono: string;
  // datos del chofer
  licenciaConducir: string;
  fechaHabilitacion: string;
  
}