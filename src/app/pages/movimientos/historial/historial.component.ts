import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { DatePipe } from '@angular/common';
import { MovimientoService } from '../../../services/movimiento.service';
import { AlertaService } from '../../../services/alerta.service';
import { CboObraComponent } from '../../../shared/components/Cbo/cbo-obra/cbo-obra.component';
import { CboTipoMovimientoHerramientaComponent } from '../../../shared/components/Cbo/cbo-tipo-movimiento-herramienta/cbo-tipo-movimiento-herramienta.component';
import { CboProveedorComponent } from '../../../shared/components/Cbo/cbo-proveedor/cbo-proveedor.component';
import { CboEstadoFisicoHerramientaComponent } from '../../../shared/components/Cbo/cbo-estado-fisico-herramienta/cbo-estado-fisico-herramienta.component';
import { CboFamiliaHerramientaComponent } from "../../../shared/components/Cbo/cbo-familia-herramienta/cbo-familia-herramienta.component";
import { CboUsuarioComponent } from "../../../shared/components/Cbo/cbo-usuario/cbo-usuario.component";

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginatorComponent,
    DatePipe,
    CboObraComponent,
    CboTipoMovimientoHerramientaComponent,
    CboProveedorComponent,
    CboEstadoFisicoHerramientaComponent,
    CboFamiliaHerramientaComponent,
    CboUsuarioComponent
  ],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  movimientos: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  loading = false;

  // Filtros
  filtroNombreHerramienta = '';
  filtroFamiliaHerramienta: number | null = null;
  filtroIdUsuarioGenera: number | null = null;
  filtroIdUsuarioResponsable: number | null = null;
  filtroIdTipoMovimiento: number | null = null;
  filtroObra: number | null = null;
  filtroProveedor: number | null = null;
  filtroEstadoFisico: string | null = null;
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  constructor(private movimientoService: MovimientoService, private alertaService: AlertaService) { }

  ngOnInit(): void {
    this.fetchMovimientos();
  }

  fetchMovimientos(): void {
    this.loading = true;
    let filters: any = {
      nombreHerramienta: this.filtroNombreHerramienta,
      idFamiliaHerramienta: this.filtroFamiliaHerramienta ?? undefined,
      idUsuarioGenera: this.filtroIdUsuarioGenera ?? undefined,
      idUsuarioResponsable: this.filtroIdUsuarioResponsable ?? undefined,
      idTipoMovimiento: this.filtroIdTipoMovimiento ?? undefined,
      idObra: this.filtroObra ?? undefined,
      idProveedor: this.filtroProveedor ?? undefined,
      idEstadoFisico: this.filtroEstadoFisico ?? undefined,
      fechaDesde: this.filtroFechaDesde,
      fechaHasta: this.filtroFechaHasta
    };

    // Remove undefined values from filters
    filters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined));

    this.movimientoService.getMovimientos(this.currentPage, this.pageSize, filters).subscribe({
      next: (resp) => {
        // Ensure movimientos is always an array
        this.movimientos = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
        this.totalItems = resp.pagination?.totalRecords || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching movimientos:', err);
        this.alertaService.error('Error al cargar los movimientos.');
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchMovimientos();
  }

  onObraSelected(obra: any): void {
    this.filtroObra = obra?.idObra || null;
    this.fetchMovimientos();
  }

  onTipoMovimientoSelected(tipoMovimiento: any): void {
    this.filtroIdTipoMovimiento = tipoMovimiento?.idTipoMovimiento || null;
    this.fetchMovimientos();
  }

  onUsuarioGeneraSelected(usuario: any): void {
    this.filtroIdUsuarioGenera = usuario?.id || null;
    this.fetchMovimientos();
  }
  onUsuarioResponsableSelected(usuario: any): void {
    this.filtroIdUsuarioResponsable = usuario?.id || null;
    this.fetchMovimientos();
  }

  onProveedorSelected(proveedor: any): void {
    this.filtroProveedor = proveedor?.idProveedor || null;
    this.fetchMovimientos();
  }


  onEstadoFisicoSelected(estadoFisico: any): void {
    this.filtroEstadoFisico = estadoFisico?.idEstadoFisico || null;
    this.fetchMovimientos();
  }
  onFamiliaHerramientaSelected(familia: any): void {
    this.filtroFamiliaHerramienta = familia?.idFamilia || null;
    this.fetchMovimientos();
  }

  onResetFilters(): void {
    this.filtroNombreHerramienta = '';
    this.filtroFamiliaHerramienta = null;
    this.filtroIdUsuarioGenera = null;
    this.filtroIdUsuarioResponsable = null;
    this.filtroIdTipoMovimiento = null;
    this.filtroObra = null;
    this.filtroProveedor = null;
    this.filtroEstadoFisico = null;
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.fetchMovimientos();
  }

  onPageEvent(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchMovimientos();
  }
}
