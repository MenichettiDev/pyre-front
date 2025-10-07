export interface CreateUserDTO {
  Nombre: string;
  Apellido: string;
  Legajo: string;
  Dni: string;
  Email: string;
  Telefono?: string; // opcional
  RolId: number;
  AccedeAlSistema: boolean;
  Activo: boolean;
  Password: string;
  Avatar?: string; // opcional
}
