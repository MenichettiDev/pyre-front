import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObrasService, ObraDto } from '../../../../services/obras.service';
import { TableSharedComponent } from '../../../../shared/components/table-shared/table-shared.component';
import { AlertaService } from '../../../../services/alerta.service';
import { ModalObrasComponent } from '../modal-obras/modal-obras.component';
import { DetailsObrasComponent } from '../details-obras/details-obras.component';

@Component({
  selector: 'app-visor-obras',
  standalone: true,
  imports: [
    CommonModule,
    TableSharedComponent,
    ModalObrasComponent,
    DetailsObrasComponent,
  ],
  templateUrl: './visor-obras.component.html',
  styleUrls: ['./visor-obras.component.css'],
  providers: [ObrasService]
})
export class VisorObrasComponent implements OnInit {
  obras: ObraDto[] = [];
  columns: string[] = ['codigo', 'nombreObra', 'ubicacion', 'fechaInicio', 'fechaFin'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 10;
  loading = false;
  totalItems = 0;

  showObraModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  showDetailsModal = false;
  detailsData: any = null;

  constructor(private obrasService: ObrasService, private alertService: AlertaService) { }

  ngOnInit(): void {
    this.fetchObras();
  }

  fetchObras(): void {
    this.loading = true;
    this.obrasService.getObrasPaged(this.currentPage, this.pageSize).subscribe({
      next: (resp) => {
        // Ajuste para la estructura de respuesta del backend
        const pagedData = resp?.data ?? {};
        const rawList = Array.isArray(pagedData.data) ? pagedData.data : [];
        this.totalItems = pagedData.totalRecords ?? rawList.length ?? 0;
        this.currentPage = pagedData.page ?? 1;
        this.pageSize = pagedData.pageSize ?? this.pageSize;
        this.obras = rawList.map((o: any) => ({
          idObra: o.idObra,
          codigo: o.codigo,
          nombreObra: o.nombreObra,
          ubicacion: o.ubicacion,
          fechaInicio: o.fechaInicio,
          fechaFin: o.fechaFin
        }));
        this.loading = false;
      },
      error: () => {
        this.showSnack('Error al cargar las obras. Por favor, inténtelo de nuevo.');
        this.loading = false;
      }
    });
  }

  editObra(item: ObraDto): void {
    const id = item?.idObra ?? null;
    if (id == null) return;
    this.modalInitialData = null;
    this.modalMode = 'edit';
    this.showObraModal = true;
    this.obrasService.getObraById(id).subscribe({
      next: (resp) => {
        this.modalInitialData = resp?.data ?? null;
      },
      error: () => {
        this.modalInitialData = item;
      }
    });
  }

  deleteObra(item: ObraDto): void {
    const id = item?.idObra ?? null;
    if (id == null) return;
    this.alertService.confirm('¿Estás seguro de que deseas eliminar esta obra?', 'Eliminar Obra')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.obrasService.deleteObra(id).subscribe({
            next: () => {
              this.alertService.success('La obra ha sido eliminada correctamente.', '¡Eliminado!');
              this.fetchObras();
            },
            error: () => {
              this.alertService.error('No se pudo eliminar la obra. Intente nuevamente.');
            }
          });
        }
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchObras();
  }

  createNewObra(): void {
    this.modalInitialData = null;
    this.modalMode = 'create';
    this.showObraModal = true;
  }

  closeObraModal(): void {
    this.showObraModal = false;
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
      this.obrasService.createObra(event.data).subscribe({
        next: () => {
          this.fetchObras();
          event.onSuccess();
        },
        error: (err) => {
          event.onError(err);
        }
      });
    } else {
      const id = Number(this.modalInitialData?.idObra ?? null);
      if (!id) {
        event.onError({ message: 'No se pudo identificar la obra a actualizar' });
        return;
      }
      this.obrasService.updateObra(id, event.data).subscribe({
        next: () => {
          this.fetchObras();
          event.onSuccess();
        },
        error: (err) => {
          event.onError(err);
        }
      });
    }
  }

  viewObra(item: ObraDto): void {
    this.detailsData = item;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsData = null;
  }

  private showSnack(message: string): void {
    console.log('SNACK:', message);
  }
}
