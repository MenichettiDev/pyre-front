import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HerramientaService } from '../../../services/herramienta.service';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  herramientasTotales = 0;
  herramientasDisponibles = 0;
  herramientasEnPrestamo = 0;
  herramientasEnReparacion = 0; // Si tienes endpoint, agregar método en el service
  alertasPendientes = 0;
  alertasVencidas = 0;

  constructor(
    private herramientaService: HerramientaService,
    private alertaService: AlertaService
  ) { }

  ngOnInit() {
    this.herramientaService.getCountHerramientasTotales().subscribe((resp: any) => {
      this.herramientasTotales = resp?.data ?? 0;
    });
    this.herramientaService.getCountHerramientasDisponibles().subscribe((resp: any) => {
      this.herramientasDisponibles = resp?.data ?? 0;
    });
    this.herramientaService.getCountHerramientasEnPrestamo().subscribe((resp: any) => {
      this.herramientasEnPrestamo = resp?.data ?? 0;
    });
    this.herramientaService.getCountHerramientasEnReparacion().subscribe((resp: any) => {
      this.herramientasEnReparacion = resp?.data ?? 0;
    });
    this.alertaService.getCountAlertasPendientes().subscribe((resp: any) => {
      this.alertasPendientes = resp?.data ?? 0;
    });
    this.alertaService.getCountAlertasVencidas().subscribe((resp: any) => {
      this.alertasVencidas = resp?.data ?? 0;
    });
  }
}
