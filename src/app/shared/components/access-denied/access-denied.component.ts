import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-4">
    <h2>Acceso denegado</h2>
    <p>No tenés permisos para ver esta página.</p>
    <button (click)="goHome()" class="btn btn-primary">Volver</button>
  </div>`
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}
  goHome() { this.router.navigate(['/dashboard']); }
}
