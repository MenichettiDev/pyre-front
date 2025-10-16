import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { Router } from '@angular/router';
import { TableSharedComponent } from '../../../shared/components/table-shared/table-shared.component';
import { UserModalComponent } from '../modal-editar-usuario/modal-editar-usuario.component';
// ConfirmModalComponent removed in favor of SweetAlert2
import { AlertaService } from '../../../services/alerta.service';
import { switchMap } from 'rxjs/operators';

interface UserRaw {
  [key: string]: any;
}

interface DisplayUser {
  id: number | null;
  legajo?: string | number;
  nombre?: string;
  apellido?: string;
  rol?: string;
  estado?: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableSharedComponent,
    UserModalComponent,
    // ConfirmModalComponent removed - not imported
  ],
  templateUrl: './visor-usuario.component.html',
  styleUrls: ['./visor-usuario.component.css'],
  providers: [UsuarioService]
})
export class UserListComponent implements OnInit {
  users: DisplayUser[] = [];
  columns: string[] = ['legajo', 'nombre', 'apellido', 'rol', 'estado'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 5;
  loading = false;
  totalItems = 0;

  // Filtros actuales
  filtroLegajo: string = '';
  filtroNombre: string = '';
  filtroApellido: string = '';
  filtroRol: string = '';
  filtroEstado: boolean | null = null; // true = activo, false = inactivo, null = cualquiera

  // Modal control
  showUserModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  // Details modal removed - no longer used

  // Confirm modal removed - using SweetAlert2 via AlertService

  constructor(private userService: UsuarioService, private router: Router, private alertService: AlertaService) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    console.log(`[UserList] fetchUsers page=${this.currentPage} size=${this.pageSize}`);
    // Construir objeto de filtros para enviar al servicio
    const filters: any = {};
    if (this.filtroLegajo && String(this.filtroLegajo).trim() !== '') filters.legajo = this.filtroLegajo.trim();
    if (this.filtroNombre && String(this.filtroNombre).trim() !== '') filters.nombre = this.filtroNombre.trim();
    if (this.filtroApellido && String(this.filtroApellido).trim() !== '') filters.apellido = this.filtroApellido.trim();
    if (this.filtroRol && String(this.filtroRol).trim() !== '') filters.rol = Number(this.filtroRol.trim());
    if (this.filtroEstado !== null) filters.estado = this.filtroEstado;

    this.userService.getUsers(this.currentPage, this.pageSize, filters).subscribe(
      (resp) => {
        console.debug('[UserList] fetchUsers - filtros enviados:', filters);
        console.debug('[UserList] fetchUsers - resp crudo del servicio:', resp);
        // Resp tiene la forma { data: any[], total: number }
        const rawList: UserRaw[] = Array.isArray(resp.data) ? resp.data : (resp.data || []);
        this.totalItems = resp.total ?? rawList.length ?? 0;

        // Normalizar cada usuario a campos en español esperados por la UI
        this.users = rawList.map((u: UserRaw) => {
          const estadoRaw = u['activo'] ?? u['estado'] ?? u['active'] ?? u['isActive'] ?? null;
          const estado = typeof estadoRaw === 'boolean' ? (estadoRaw ? 'Activo' : 'Inactivo') : (estadoRaw ?? '');

          return {
            id: u['id'] ?? u['userId'] ?? null,
            legajo: u['legajo'] ?? u['legajo_number'] ?? u['legajoNumber'] ?? u['id'] ?? '',
            nombre: u['nombre'] ?? u['firstName'] ?? u['name'] ?? '',
            apellido: u['apellido'] ?? u['lastName'] ?? u['surname'] ?? '',
            rol: u['rol'] ?? u['role'] ?? u['rolNombre'] ?? u['roleName'] ?? '',
            estado: estado
          } as DisplayUser;
        });

        this.loading = false;
      },
      (error: any) => {
        console.error('Error fetching users:', error);
        this.showSnack('Error al cargar los usuarios. Por favor, inténtelo de nuevo.');
        this.loading = false;
      }
    );
  }

  // Handler que recibe el objeto { legajo?, nombre?, apellido?, rol?, estado? } desde app-table-shared
  onSearch(criteria: { legajo?: string; nombre?: string; apellido?: string; rol?: string | number; estado?: string | null }) {
    // Normalizar y almacenar filtros
    this.filtroLegajo = criteria?.legajo ?? '';
    this.filtroNombre = criteria?.nombre ?? '';
    this.filtroApellido = criteria?.apellido ?? '';
    this.filtroRol = criteria?.rol ? criteria.rol.toString() : '';

    // El componente table-shared emite estado como string; normalizamos a boolean|null
    const estadoRaw = criteria?.estado ?? null;
    if (estadoRaw === null || estadoRaw === undefined || String(estadoRaw).trim() === '') {
      this.filtroEstado = null;
    } else {
      const s = String(estadoRaw).toLowerCase();
      if (s === 'true' || s === 'activo' || s === '1') this.filtroEstado = true;
      else if (s === 'false' || s === 'inactivo' || s === '0') this.filtroEstado = false;
      else this.filtroEstado = null;
    }

    // Reiniciar a primera página al aplicar filtros
    this.currentPage = 1;
    this.fetchUsers();
  }

  // Handler para resetear filtros
  onResetFilters() {
    this.filtroLegajo = '';
    this.filtroNombre = '';
    this.filtroApellido = '';
    this.filtroRol = '';
    this.filtroEstado = null;
    this.currentPage = 1;
    this.fetchUsers();
  }

  // Método helper para obtener el estado como string para el template
  getEstadoAsString(): string | null {
    if (this.filtroEstado === null || this.filtroEstado === undefined) return null;
    return this.filtroEstado === true ? 'activo' : 'inactivo';
  }

  // Ahora recibimos el objeto emitido por la tabla y extraemos el id
  editUser(item: any): void {
    const id = item?.id ?? null;
    if (id == null) return;

    // ⚡ Abrir modal inmediatamente con estado de loading
    this.modalInitialData = null; // Indicará loading en el modal
    this.modalMode = 'edit';
    this.showUserModal = true;

    // 🔄 Cargar datos en segundo plano
    this.userService.getUserById(Number(id)).subscribe(
      (resp) => {
        // ✅ Actualizar datos del modal cuando lleguen del backend
        this.modalInitialData = resp?.data ?? resp ?? null;
      },
      (err) => {
        console.error('[UserList] error loading user by id', err);
        // ❌ En caso de error, usar datos básicos de la tabla como fallback
        this.modalInitialData = item;
      }
    );
  }

  // closeDetailsModal removed

  deleteUser(item: any): void {
    const id = item?.id ?? null;
    if (id == null) return;

    // Usar SweetAlert2 centralizado para confirmar eliminación
    this.alertService.confirm('¿Estás seguro de que deseas eliminar este usuario?', 'Eliminar Usuario')
      .then((result: any) => {
        if (result && result.isConfirmed) {
          // Llamada al backend para eliminar
          this.userService.deleteUser(Number(id)).subscribe({
            next: () => {
              this.alertService.success('El usuario ha sido eliminado correctamente.', '¡Eliminado!');
              this.fetchUsers();
            },
            error: (err) => {
              console.error('[UserList] deleteUser error', err);
              this.alertService.error('No se pudo eliminar el usuario. Intente nuevamente.');
            }
          });
        }
      });
  }

  // Alterna el estado activo/inactivo de un usuario desde la lista
  toggleUserActive(item: any): void {
    const id = item?.id ?? null;
    if (id == null) return;

    const current = (item?.estado ?? '').toString().toLowerCase() === 'activo';
    const targetState = !current;

    const actionText = targetState ? 'activar' : 'desactivar';
    this.alertService.confirm(`¿Estás seguro de que deseas ${actionText} este usuario?`, `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Usuario`)
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.userService.toggleActivo(Number(id)).subscribe({
            next: (resp) => {
              const pastText = targetState ? 'activado' : 'desactivado';
              this.alertService.success(`Usuario ${pastText} correctamente.`, '¡Hecho!');
              // Refrescar la lista para obtener el estado actualizado desde backend
              this.fetchUsers();
            },
            error: (err) => {
              console.error('[UserList] toggleUserActive error', err);
              this.alertService.error('No se pudo cambiar el estado del usuario. Intente nuevamente.');
            }
          });
        }
      });
  }

  onConfirmModal(): void {
    // No-op: kept for backward compatibility if called elsewhere
  }

  closeConfirmModal(): void {
    // No-op (confirm modal removed)
  }

  showSuccessSwal(title: string, message: string): void {
    console.log(`SNACK: ${title} - ${message}`);
  }

  // Handler para el paginator externo (app-paginator)
  onPageChange(event: { pageIndex: number; pageSize: number }) {
    console.log(`[UserList] external onPageChange pageIndex=${event.pageIndex} pageSize=${event.pageSize}`);
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchUsers();
  }

  openUserModal(): void {
    this.showUserModal = true;
  }

  // Método específico para crear nuevo usuario
  createNewUser(): void {
    this.modalInitialData = null;  // ✅ Limpiar datos previos
    this.modalMode = 'create';     // ✅ Asegurar modo crear
    this.openUserModal();
  }

  closeUserModal(): void {
    this.showUserModal = false;
    // ✅ Limpiar datos al cerrar para evitar interferencias
    this.modalInitialData = null;
    this.modalMode = 'create';
  }

  handleCreateUser(newUser: any): void {
    // Inserción local y temporal: asignar un id simulado y añadir al inicio de la lista
    const simulatedId = (this.totalItems || this.users.length) + 1;
    const display = {
      id: simulatedId,
      legajo: newUser.Legajo,
      nombre: newUser.Nombre,
      apellido: newUser.Apellido,
      rol: `ID ${newUser.RolId}`,
      estado: newUser.Activo ? 'Activo' : 'Inactivo'
    };

    this.users = [display, ...this.users];
    this.totalItems = (this.totalItems || this.users.length) + 1;
    this.showUserModal = false;
    console.log('[UserList] Usuario creado localmente:', newUser);
  }

  // Handler para el evento submit del modal
  async onModalSubmit(event: {
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }) {
    if (event.mode === 'create') {
      // Llamada al backend para crear
      this.userService.createUser(event.data).subscribe({
        next: (resp) => {
          // refrescar lista o insertar localmente
          this.fetchUsers();
          event.onSuccess(); // ✅ Mostrar mensaje de éxito
        },
        error: (err) => {
          console.error('[UserList] createUser error', err);
          event.onError(err); // ❌ Mostrar mensaje de error
        }
      });
    } else {
      // update: necesitamos un id; si modalInitialData tiene id, usarlo
      const id = Number(this.modalInitialData?.id ?? this.modalInitialData?.userId ?? null);
      if (!id) {
        console.warn('[UserList] update requested but no id available');
        event.onError({ message: 'No se pudo identificar el usuario a actualizar' });
        return;
      }
      this.userService.updateUser(id, event.data).subscribe({
        next: (resp) => {
          this.fetchUsers();
          event.onSuccess(); // ✅ Mostrar mensaje de éxito
        },
        error: (err) => {
          console.error('[UserList] updateUser error', err);
          event.onError(err); // ❌ Mostrar mensaje de error
        }
      });
    }
  }



  // Implementación local simple para reemplazar MatSnackBar durante edición rápida en el editor.
  private showSnack(message: string): void {
    // En ejecución real puedes volver a usar MatSnackBar; aquí se usa console para evitar la dependencia.
    console.log('SNACK:', message);
  }
}
