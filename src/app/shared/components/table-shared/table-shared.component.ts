import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginatorComponent } from '../paginator/paginator.component'; // Tu paginador personalizado

@Component({
  selector: 'app-table-shared',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
    TableModule,
    PaginatorModule,
    ButtonModule,
    NgbTooltipModule,
    TagModule,
    RippleModule,
    PaginatorComponent, // Componente personalizado del paginador
  ],
  templateUrl: './table-shared.component.html',
  styleUrls: ['./table-shared.component.css'],
})
export class TableSharedComponent {
  // Datos de la tabla
  @Input() value: any[] = [];

  // Definición de columnas (puedes adaptarlo a un modelo de columnas si usas objetos)
  @Input() columns: string[] = [];

  // Configuración de paginación
  @Input() rows = 6;
  @Input() rowsPerPageOptions = [6, 12, 24, 48];

  // Estilo compacto para la tabla
  @Input() compact = false;

  // Total de registros para paginación
  @Input() totalRecords: number = 0;

  // Estado de carga (loading spinner)
  @Input() loading: boolean = false;

  // Si se usa paginador externo (personalizado)
  @Input() useExternalPaginator: boolean = false;

  // Para el paginador externo (índice actual y total)
  @Input() pageIndex: number = 0;
  @Input() length: number = 0;

  // Emitir evento al cambiar de página (paginar externo)
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  // Acciones disponibles por fila (editar, ver, eliminar)
  @Output() edit = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();
  // Emit when the estado toggle control is changed
  @Output() toggle = new EventEmitter<any>();
  /**
   * Tamaño del toggle visual: 'normal' (por defecto) o 'small'.
   * Permite usar una variante más compacta en tablas.
   */
  @Input() toggleSize: 'normal' | 'small' = 'normal';
  // Control para mostrar/ocultar el botón 'Ver detalles'
  @Input() showView: boolean = true;

  // Search/filter output: emit criteria object { nombre, legajo, estado }
  @Output() search = new EventEmitter<{ nombre?: string; legajo?: string; estado?: string }>();

  // local model for filters
  filtroNombre: string = '';
  filtroLegajo: string = '';
  filtroEstado: string = '';

  // === Métodos ===

  onEdit(item: any) {
    this.edit.emit(item);
  }

  onView(item: any) {
    this.view.emit(item);
  }

  onRemove(item: any) {
    this.remove.emit(item);
  }

  // Emitted when the estado checkbox/switch is toggled in a row
  onToggle(item: any, event: Event) {
    // evitar que el evento afecte otras interacciones de la fila
    event.stopPropagation();
    this.toggle.emit(item);
  }

  /**
   * Recibe evento del componente paginador externo (app-paginator) y lo re-emite al padre.
   * El padre debe encargarse de actualizar los datos visibles.
   */
  onExternalPageChange(evt: { pageIndex: number; pageSize: number }) {
    this.pageChange.emit(evt);
  }

  // Emit search criteria to parent
  onSearch() {
    this.search.emit({ nombre: this.filtroNombre?.trim(), legajo: this.filtroLegajo?.trim(), estado: this.filtroEstado });
  }
}
