import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableSharedComponent } from '../../../shared/components/table-shared/table-shared.component';
import { HerramientaService } from '../../../services/herramienta.service';
import { ToolModalComponent } from '../../herramienta/tool-modal/tool-modal.component'; // Nuevo modal
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-tool-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableSharedComponent, ToolModalComponent],
  templateUrl: './tool-list.component.html',
  styleUrls: ['./tool-list.component.css']
})
export class ToolListComponent implements OnInit {
  tools: any[] = [];
  columns: string[] = ['codigo', 'nombre', 'marca', 'estadoFisico', 'disponibilidad'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 5;
  loading = false;
  totalItems = 0;

  // Filtros y modal control
  filtroCodigo: string = '';
  filtroNombre: string = '';
  filtroMarca: string = '';
  filtroTipo: string = '';
  filtroEstadoFisico: string = '';
  filtroDisponibilidad: string = '';
  filtroUbicacion: string = '';
  filtroPlanta: string = '';

  showToolModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  constructor(private srvHerramienta: HerramientaService, private srvAlerta: AlertaService) { }

  ngOnInit(): void {
    this.fetchTools();
  }

  fetchTools(): void {
    this.loading = true;
    let search = '';
    if (this.filtroCodigo) search += this.filtroCodigo.trim();
    if (this.filtroNombre) search += (search ? ' ' : '') + this.filtroNombre.trim();

    this.srvHerramienta.getTools(this.currentPage, this.pageSize, search).subscribe(
      (response) => {
        // Mapear disponibilidad desde estadoDisponibilidad, ya no se incluye ubicacion
        this.tools = (response.data ?? []).map((tool: any) => ({
          ...tool,
          disponibilidad: tool.estadoDisponibilidad ?? tool.disponibilidad ?? ''
        }));
        this.totalItems = response.total;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching tools:', error);
        this.loading = false;
      }
    );
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchTools();
  }

  onSearch(criteria: any): void {
    // Mapear criterios a filtros
    this.filtroCodigo = criteria?.codigo ?? '';
    this.filtroNombre = criteria?.nombre ?? '';
    this.filtroMarca = criteria?.marca ?? '';
    this.filtroTipo = criteria?.tipo ?? '';
    this.filtroEstadoFisico = criteria?.estadoFisico ?? '';
    this.filtroDisponibilidad = criteria?.disponibilidad ?? '';
    this.filtroUbicacion = criteria?.ubicacion ?? '';
    this.filtroPlanta = criteria?.planta ?? '';
    this.currentPage = 1;
    this.fetchTools();
  }

  onResetFilters(): void {
    this.filtroCodigo = '';
    this.filtroNombre = '';
    this.filtroMarca = '';
    this.filtroTipo = '';
    this.filtroEstadoFisico = '';
    this.filtroDisponibilidad = '';
    this.filtroUbicacion = '';
    this.filtroPlanta = '';
    this.currentPage = 1;
    this.fetchTools();
  }

  // Métodos para modal
  createNewTool(): void {
    this.modalInitialData = null;
    this.modalMode = 'create';
    this.showToolModal = true;
  }

  // Abrir modal en modo edición/lectura
  editTool(item: any): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;
    this.modalInitialData = null;
    this.modalMode = 'edit';
    this.showToolModal = true;
    this.srvHerramienta.getToolById(Number(id)).subscribe(
      (resp: any) => {
        this.modalInitialData = resp?.data ?? resp ?? null;
      },
      (err: any) => {
        this.modalInitialData = item;
      }
    );
  }

  // Eliminar herramienta con confirmación SweetAlert2
  deleteTool(item: any): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;
    this.srvAlerta.confirm('¿Estás seguro de que deseas eliminar esta herramienta?', 'Eliminar Herramienta')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.srvHerramienta.deleteTool(Number(id)).subscribe({
            next: () => {
              this.srvAlerta.success('La herramienta ha sido eliminada correctamente.', '¡Eliminada!');
              this.fetchTools();
            },
            error: (err) => {
              this.srvAlerta.error('No se pudo eliminar la herramienta. Intente nuevamente.');
            }
          });
        }
      });
  }

  // Alternar estado activo/inactivo (opcional, si el backend lo soporta)
  toggleToolActive(item: any): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;
    const current = (item?.activo ?? item?.estado ?? '').toString().toLowerCase() === 'true' || (item?.estado ?? '').toString().toLowerCase() === 'activo';
    const targetState = !current;
    const actionText = targetState ? 'activar' : 'desactivar';
    this.srvAlerta.confirm(`¿Estás seguro de que deseas ${actionText} esta herramienta?`, `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Herramienta`)
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.srvHerramienta.toggleActivo(Number(id)).subscribe({
            next: () => {
              const pastText = targetState ? 'activada' : 'desactivada';
              this.srvAlerta.success(`Herramienta ${pastText} correctamente.`, '¡Hecho!');
              this.fetchTools();
            },
            error: () => {
              this.srvAlerta.error('No se pudo cambiar el estado de la herramienta. Intente nuevamente.');
            }
          });
        }
      });
  }

  closeToolModal(): void {
    this.showToolModal = false;
    this.modalInitialData = null;
    this.modalMode = 'create';
  }

  // Handler para el evento submit del modal
  async onModalSubmit(event: {
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }) {
    if (event.mode === 'create') {
      this.srvHerramienta.createTool(event.data).subscribe({
        next: (resp: any) => {
          this.fetchTools();
          event.onSuccess();
        },
        error: (err: any) => {
          event.onError(err);
        }
      });
    } else {
      const id = Number(this.modalInitialData?.id ?? this.modalInitialData?.idHerramienta ?? null);
      if (!id) {
        event.onError({ message: 'No se pudo identificar la herramienta a actualizar' });
        return;
      }
      this.srvHerramienta.updateTool(id, event.data).subscribe({
        next: (resp: any) => {
          this.fetchTools();
          event.onSuccess();
        },
        error: (err: any) => {
          event.onError(err);
        }
      });
    }
  }
}
