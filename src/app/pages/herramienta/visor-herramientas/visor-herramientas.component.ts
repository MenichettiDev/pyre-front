import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HerramientaService } from '../../../services/herramienta.service';
import { HerramientasModalComponent } from '../herramienta-modal/herramientas-modal.component';
import { AlertaService } from '../../../services/alerta.service';

interface HerramientaDto {
  id?: number;
  idHerramienta?: number;
  codigo?: string;
  nombre?: string;
  marca?: string;
  tipo?: string;
  estadoFisico?: string;
  disponibilidad?: string;
  estadoDisponibilidad?: string;
  ubicacion?: string;
  planta?: string;
  activo?: boolean;
  estado?: string;
}

@Component({
  selector: 'app-herramientas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HerramientasModalComponent
  ],
  templateUrl: './visor-herramientas.component.html',
  styleUrls: ['./visor-herramientas.component.css']
})
export class VisorHerramientasComponent implements OnInit {
  herramientas: HerramientaDto[] = [];
  filteredHerramientas: HerramientaDto[] = [];
  columns: string[] = ['codigo', 'nombre', 'marca', 'estadoFisico', 'disponibilidad'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 10;
  loading = false;
  totalItems = 0;
  totalPages = 0;

  // Expose Math to template
  Math = Math;

  // Filtros
  filtroCodigo: string = '';
  filtroNombre: string = '';
  filtroMarca: string = '';
  filtroEstado: string = '';

  showToolModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  constructor(private srvHerramienta: HerramientaService, private srvAlerta: AlertaService) { }

  ngOnInit(): void {
    this.fetchHerramientas();
  }

  fetchHerramientas(): void {
    this.loading = true;

    // Construir término de búsqueda simple
    let search = '';
    if (this.filtroCodigo?.trim()) search += this.filtroCodigo.trim();
    if (this.filtroNombre?.trim()) search += (search ? ' ' : '') + this.filtroNombre.trim();

    this.srvHerramienta.getTools(this.currentPage, this.pageSize, search).subscribe({
      next: (response) => {
        const rawList = response.data ?? [];
        this.totalItems = response.total ?? rawList.length ?? 0;

        // Normalizar datos
        this.herramientas = rawList.map((tool: any) => ({
          id: tool.id ?? tool.idHerramienta,
          idHerramienta: tool.idHerramienta ?? tool.id,
          codigo: tool.codigo ?? '',
          nombre: tool.nombre ?? '',
          marca: tool.marca ?? '',
          tipo: tool.tipo ?? '',
          estadoFisico: tool.estadoFisico ?? '',
          disponibilidad: tool.estadoDisponibilidad ?? tool.disponibilidad ?? '',
          ubicacion: tool.ubicacion ?? '',
          planta: tool.planta ?? '',
          activo: tool.activo ?? true,
          estado: tool.estado ?? (tool.activo ? 'Activo' : 'Inactivo')
        }));

        this.applyFilters();
        this.calculatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching herramientas:', error);
        this.showSnack('Error al cargar las herramientas. Por favor, inténtelo de nuevo.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredHerramientas = this.herramientas.filter(herramienta => {
      const matchesCodigo = !this.filtroCodigo ||
        herramienta.codigo?.toLowerCase().includes(this.filtroCodigo.toLowerCase());

      const matchesNombre = !this.filtroNombre ||
        herramienta.nombre?.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const matchesMarca = !this.filtroMarca ||
        herramienta.marca?.toLowerCase().includes(this.filtroMarca.toLowerCase());

      const matchesEstado = !this.filtroEstado ||
        (this.filtroEstado === 'activo' && herramienta.activo) ||
        (this.filtroEstado === 'inactivo' && !herramienta.activo);

      return matchesCodigo && matchesNombre && matchesMarca && matchesEstado;
    });

    this.totalItems = this.filteredHerramientas.length;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPaginatedHerramientas(): HerramientaDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredHerramientas.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onResetFilters(): void {
    this.filtroCodigo = '';
    this.filtroNombre = '';
    this.filtroMarca = '';
    this.filtroEstado = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filtroCodigo?.trim() || this.filtroNombre?.trim() || this.filtroMarca?.trim() || this.filtroEstado);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  createNewTool(): void {
    this.modalInitialData = null;
    this.modalMode = 'create';
    this.showToolModal = true;
  }

  editTool(item: HerramientaDto): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;

    this.modalInitialData = null;
    this.modalMode = 'edit';
    this.showToolModal = true;

    this.srvHerramienta.getToolById(Number(id)).subscribe({
      next: (resp: any) => {
        this.modalInitialData = resp?.data ?? resp ?? null;
      },
      error: (err: any) => {
        this.modalInitialData = item;
      }
    });
  }

  deleteTool(item: HerramientaDto): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;

    this.srvAlerta.confirm('¿Estás seguro de que deseas eliminar esta herramienta?', 'Eliminar Herramienta')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.srvHerramienta.deleteTool(Number(id)).subscribe({
            next: () => {
              this.srvAlerta.success('La herramienta ha sido eliminada correctamente.', '¡Eliminada!');
              this.fetchHerramientas();
            },
            error: () => {
              this.srvAlerta.error('No se pudo eliminar la herramienta. Intente nuevamente.');
            }
          });
        }
      });
  }

  toggleToolActive(item: HerramientaDto): void {
    const id = item?.id ?? item?.idHerramienta ?? null;
    if (id == null) return;

    const current = item.activo;
    const targetState = !current;
    const actionText = targetState ? 'activar' : 'desactivar';

    this.srvAlerta.confirm(`¿Estás seguro de que deseas ${actionText} esta herramienta?`, `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Herramienta`)
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.srvHerramienta.toggleActivo(Number(id)).subscribe({
            next: () => {
              const pastText = targetState ? 'activada' : 'desactivada';
              this.srvAlerta.success(`Herramienta ${pastText} correctamente.`, '¡Hecho!');
              this.fetchHerramientas();
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

  async onModalSubmit(event: {
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }) {
    if (event.mode === 'create') {
      this.srvHerramienta.createTool(event.data).subscribe({
        next: () => {
          this.fetchHerramientas();
          event.onSuccess();
        },
        error: (err) => {
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
        next: () => {
          this.fetchHerramientas();
          event.onSuccess();
        },
        error: (err) => {
          event.onError(err);
        }
      });
    }
  }

  private showSnack(message: string): void {
    console.log('SNACK:', message);
  }
}
