import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedoresService } from '../../../../core/services/proveedores.service';
import { TableSharedComponent } from '../../../../shared/components/table-shared/table-shared.component';
import { AlertService } from '../../../../core/services/alert.service';
import { ModalProveedorComponent } from '../modal-proveedor/modal-proveedor.component';
import { DetailsProveedoresComponent } from '../details-proveedores/details-proveedores.component';

export interface ProveedorDto {
  idProveedor: number;
  nombreProveedor: string;
  contacto: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

@Component({
  selector: 'app-visor-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    TableSharedComponent,
    ModalProveedorComponent,
    DetailsProveedoresComponent,
  ],
  templateUrl: './visor-proveedores.component.html',
  styleUrls: ['./visor-proveedores.component.css'],
  providers: [ProveedoresService]
})
export class VisorProveedoresComponent implements OnInit {
  proveedores: ProveedorDto[] = [];
  columns: string[] = ['nombreProveedor', 'contacto', 'cuit', 'telefono', 'email', 'direccion', 'activo'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 5;
  loading = false;
  totalItems = 0;

  showProveedorModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  // Agrega las propiedades para el modal de detalles
  showDetailsModal = false;
  detailsData: any = null;

  constructor(private proveedoresService: ProveedoresService, private alertService: AlertService) { }

  ngOnInit(): void {
    this.fetchProveedores();
  }

  fetchProveedores(): void {
    this.loading = true;
    this.proveedoresService.getProveedores(this.currentPage, this.pageSize).subscribe({
      next: (resp) => {
        // Ajuste para la estructura de respuesta del backend
        const pagedData = resp?.data ?? {};
        const rawList = Array.isArray(pagedData.data) ? pagedData.data : [];
        this.totalItems = pagedData.totalRecords ?? rawList.length ?? 0;
        this.currentPage = pagedData.page ?? 1;
        this.pageSize = pagedData.pageSize ?? this.pageSize;
        this.proveedores = rawList.map((p: any) => ({
          idProveedor: p.idProveedor,
          nombreProveedor: p.nombreProveedor,
          contacto: p.contacto,
          cuit: p.cuit,
          telefono: p.telefono,
          email: p.email,
          direccion: p.direccion,
          activo: p.activo
        }));
        this.loading = false;
      },
      error: () => {
        this.showSnack('Error al cargar los proveedores. Por favor, inténtelo de nuevo.');
        this.loading = false;
      }
    });
  }

  editProveedor(item: ProveedorDto): void {
    const id = item?.idProveedor ?? null;
    if (id == null) return;
    this.modalInitialData = null;
    this.modalMode = 'edit';
    this.showProveedorModal = true;
    this.proveedoresService.getProveedorById(id).subscribe({
      next: (resp) => {
        this.modalInitialData = resp?.data ?? null;
      },
      error: () => {
        this.modalInitialData = item;
      }
    });
  }

  deleteProveedor(item: ProveedorDto): void {
    const id = item?.idProveedor ?? null;
    if (id == null) return;
    this.alertService.confirm('¿Estás seguro de que deseas eliminar este proveedor?', 'Eliminar Proveedor')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.proveedoresService.deleteProveedor(id).subscribe({
            next: () => {
              this.alertService.success('El proveedor ha sido eliminado correctamente.', '¡Eliminado!');
              this.fetchProveedores();
            },
            error: () => {
              this.alertService.error('No se pudo eliminar el proveedor. Intente nuevamente.');
            }
          });
        }
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchProveedores();
  }

  createNewProveedor(): void {
    this.modalInitialData = null;
    this.modalMode = 'create';
    this.showProveedorModal = true;
  }

  closeProveedorModal(): void {
    this.showProveedorModal = false;
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
      this.proveedoresService.createProveedor(event.data).subscribe({
        next: () => {
          this.fetchProveedores();
          event.onSuccess();
        },
        error: (err) => {
          event.onError(err);
        }
      });
    } else {
      const id = Number(this.modalInitialData?.idProveedor ?? null);
      if (!id) {
        event.onError({ message: 'No se pudo identificar el proveedor a actualizar' });
        return;
      }
      this.proveedoresService.updateProveedor(id, event.data).subscribe({
        next: () => {
          this.fetchProveedores();
          event.onSuccess();
        },
        error: (err) => {
          event.onError(err);
        }
      });
    }
  }

  // Método para abrir el modal de detalles
  viewProveedor(item: ProveedorDto): void {
    this.detailsData = item;
    this.showDetailsModal = true;
  }

  // Método para cerrar el modal de detalles
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsData = null;
  }

  private showSnack(message: string): void {
    console.log('SNACK:', message);
  }
}
