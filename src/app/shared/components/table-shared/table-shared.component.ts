import { Component, EventEmitter, Input, Output, OnInit, OnChanges, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Roles } from '../../enums/roles';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginatorComponent } from '../paginator/paginator.component'; // Tu paginador personalizado

// Tipo para los filtros disponibles
export type FilterType = 'legajo' | 'nombre' | 'apellido' | 'rol' | 'estado';

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
export class TableSharedComponent implements OnInit, OnChanges {
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

  // Search/filter output: emit criteria object { legajo, nombre, apellido, rol, estado }
  @Output() search = new EventEmitter<{ legajo?: string; nombre?: string; apellido?: string; rol?: string | number; estado?: string }>();

  // Output para resetear filtros
  @Output() resetFilters = new EventEmitter<void>();

  // local model for filters - ordenados según las columnas de la tabla
  filtroLegajo: string = '';      // Columna 1
  filtroNombre: string = '';      // Columna 2
  filtroApellido: string = '';    // Columna 3
  filtroRol: string = '';         // Columna 4 - almacena ID numérico como string
  filtroEstado: string = '';      // Columna 5

  // Inputs para mantener los valores de los filtros desde el componente padre
  @Input() filterValues: { legajo?: string; nombre?: string; apellido?: string; rol?: string | number; estado?: string | null } = {};

  // Exponer el enum de roles al template
  readonly Roles = Roles;

  // Nuevo Input para seleccionar estilo de dropdown: 'soft' (por defecto) o 'compact'
  @Input() dropdownStyle: 'soft' | 'compact' = 'soft';

  // Nuevo Input para controlar qué filtros están habilitados
  @Input() enabledFilters: FilterType[] = ['legajo', 'nombre', 'apellido', 'rol', 'estado'];

  // Host classes para permitir selectores CSS condicionados
  @HostBinding('class.soft-dropdown') get isSoft() { return this.dropdownStyle === 'soft'; }
  @HostBinding('class.compact-dropdown') get isCompact() { return this.dropdownStyle === 'compact'; }

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
    this.search.emit({
      legajo: this.filtroLegajo?.trim(),
      nombre: this.filtroNombre?.trim(),
      apellido: this.filtroApellido?.trim(),
      rol: this.filtroRol?.trim() ? Number(this.filtroRol.trim()) : undefined, // Convertir a número para el backend
      estado: this.filtroEstado
    });
  }

  // Resetear todos los filtros
  onResetFilters() {
    this.filtroLegajo = '';
    this.filtroNombre = '';
    this.filtroApellido = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.resetFilters.emit();
  }

  // Verificar si hay filtros activos para mostrar/ocultar el botón de reset
  hasActiveFilters(): boolean {
    return !!(this.filtroLegajo?.trim() || this.filtroNombre?.trim() || this.filtroApellido?.trim() || this.filtroRol?.trim() || this.filtroEstado);
  }

  // Obtener las opciones de roles para el select
  getRolesOptions(): { value: string; label: string }[] {
    return Object.entries(Roles)
      .filter(([key, value]) => typeof value === 'number' && key !== 'Administrativo') // Excluir el alias duplicado
      .map(([key, value]) => ({
        value: value.toString(), // ID numérico como string para el select (ej: "1", "2", "3", "4")
        label: key === 'SuperAdmin' ? 'Super Admin' : key // Nombre legible para el usuario
      }));
  }

  // Método para sincronizar los valores de los filtros con los del padre
  ngOnInit() {
    this.updateFilterValues();
  }

  ngOnChanges() {
    this.updateFilterValues();
  }

  private updateFilterValues() {
    if (this.filterValues) {
      // Solo actualizar si los valores han cambiado para evitar loops
      if (this.filtroLegajo !== (this.filterValues.legajo || '')) {
        this.filtroLegajo = this.filterValues.legajo || '';
      }
      if (this.filtroNombre !== (this.filterValues.nombre || '')) {
        this.filtroNombre = this.filterValues.nombre || '';
      }
      if (this.filtroApellido !== (this.filterValues.apellido || '')) {
        this.filtroApellido = this.filterValues.apellido || '';
      }
      // Para el rol, verificar si el valor corresponde a una opción válida del enum
      const expectedRol = (this.filterValues.rol || '').toString();
      if (this.filtroRol !== expectedRol) {
        // Verificar si el valor es uno de los IDs de roles válidos
        const rolesOptions = this.getRolesOptions();
        const isValidRoleId = rolesOptions.some(r => r.value === expectedRol);
        this.filtroRol = isValidRoleId ? expectedRol : '';
      }

      // Convertir el estado del padre al formato esperado por el select
      const estado = this.filterValues.estado;
      let expectedEstado = '';
      if (estado === 'activo' || estado === 'true' || estado === 'Activo') {
        expectedEstado = 'activo';
      } else if (estado === 'inactivo' || estado === 'false' || estado === 'Inactivo') {
        expectedEstado = 'inactivo';
      }

      if (this.filtroEstado !== expectedEstado) {
        this.filtroEstado = expectedEstado;
      }
    }
  }

  // Método helper para verificar si un filtro está habilitado
  isFilterEnabled(filterType: FilterType): boolean {
    return this.enabledFilters.includes(filterType);
  }
}
