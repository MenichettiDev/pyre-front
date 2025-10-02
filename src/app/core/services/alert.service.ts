import { Injectable } from '@angular/core';

declare const Swal: any;

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  // Modal de confirmación
  confirm(message: string, title: string = '¿Estás seguro?'): Promise<any> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal2-popup swal2-themed',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
    });
  }

  // Modal de éxito
  success(message: string, title: string = '¡Éxito!'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'swal2-popup swal2-themed',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm',
      },
    });
  }

  // Modal de error
  error(message: string, title: string = 'Error'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'swal2-popup swal2-themed',
        title: 'swal2-title',
        confirmButton: 'swal2-confirm',
      },
    });
  }
}
