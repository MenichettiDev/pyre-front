import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { Router } from '@angular/router';
import { UserModalComponent } from '../modal-editar-usuario/modal-editar-usuario.component';
import { AlertaService } from '../../../services/alerta.service';
import { Roles } from '../../../shared/enums/roles';

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
  activo?: boolean;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UserModalComponent,
  ],
  templateUrl: './visor-usuario.component.html',
  styleUrls: ['./visor-usuario.component.css'],
  providers: [UsuarioService]
})
export class UserListComponent implements OnInit {
  users: DisplayUser[] = [];
  filteredUsers: DisplayUser[] = [];
  columns: string[] = ['legajo', 'nombre', 'apellido', 'rol', 'estado'];
  rowsPerPageOptions: number[] = [5, 10, 20, 40];
  currentPage = 1;
  pageSize = 10;
  loading = false;
  totalItems = 0;
  totalPages = 0;

  // Expose Math to template
  Math = Math;

  // Filtros
  filtroLegajo: string = '';
  filtroNombre: string = '';
  filtroApellido: string = '';
  filtroRol: string = '';
  filtroEstado: string = '';

  // Modal control
  showUserModal = false;
  modalInitialData: any = null;
  modalMode: 'create' | 'edit' = 'create';

  // Exponer el enum de roles al template
  readonly Roles = Roles;

  constructor(private userService: UsuarioService, private router: Router, private alertService: AlertaService) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    console.log(`[UserList] fetchUsers page=${this.currentPage} size=${this.pageSize}`);

    // Construir objeto de filtros para enviar al servicio
    const filters: any = {};
    if (this.filtroLegajo?.trim()) filters.legajo = this.filtroLegajo.trim();
    if (this.filtroNombre?.trim()) filters.nombre = this.filtroNombre.trim();
    if (this.filtroApellido?.trim()) filters.apellido = this.filtroApellido.trim();
    if (this.filtroRol?.trim()) filters.rol = Number(this.filtroRol.trim());

    // Convertir estado de string a boolean para el backend
    if (this.filtroEstado) {
      filters.estado = this.filtroEstado === 'activo';
    }

    this.userService.getUsers(this.currentPage, this.pageSize, filters).subscribe({
      next: (resp) => {
        console.debug('[UserList] fetchUsers - filtros enviados:', filters);
        console.debug('[UserList] fetchUsers - resp crudo del servicio:', resp);

        const rawList: UserRaw[] = Array.isArray(resp.data) ? resp.data : (resp.data || []);
        this.totalItems = resp.total ?? rawList.length ?? 0;

        // Normalizar cada usuario a campos en español esperados por la UI
        this.users = rawList.map((u: UserRaw) => {
          const estadoRaw = u['activo'] ?? u['estado'] ?? u['active'] ?? u['isActive'] ?? null;
          const activo = typeof estadoRaw === 'boolean' ? estadoRaw : (estadoRaw === 'Activo' || estadoRaw === true);
          const estado = activo ? 'Activo' : 'Inactivo';

          return {
            id: u['id'] ?? u['userId'] ?? null,
            legajo: u['legajo'] ?? u['legajo_number'] ?? u['legajoNumber'] ?? u['id'] ?? '',
            nombre: u['nombre'] ?? u['firstName'] ?? u['name'] ?? '',
            apellido: u['apellido'] ?? u['lastName'] ?? u['surname'] ?? '',
            rol: u['rol'] ?? u['role'] ?? u['rolNombre'] ?? u['roleName'] ?? '',
            estado: estado,
            activo: activo
          } as DisplayUser;
        });

        this.applyFilters();
        this.calculatePagination();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching users:', error);
        this.showSnack('Error al cargar los usuarios. Por favor, inténtelo de nuevo.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesLegajo = !this.filtroLegajo ||
        user.legajo?.toString().toLowerCase().includes(this.filtroLegajo.toLowerCase());

      const matchesNombre = !this.filtroNombre ||
        user.nombre?.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const matchesApellido = !this.filtroApellido ||
        user.apellido?.toLowerCase().includes(this.filtroApellido.toLowerCase());

      const matchesRol = !this.filtroRol ||
        this.getRolNameById(Number(this.filtroRol))?.toLowerCase().includes(user.rol?.toLowerCase() || '');

      const matchesEstado = !this.filtroEstado ||
        (this.filtroEstado === 'activo' && user.activo) ||
        (this.filtroEstado === 'inactivo' && !user.activo);

      return matchesLegajo && matchesNombre && matchesApellido && matchesRol && matchesEstado;
    });

    this.totalItems = this.filteredUsers.length;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPaginatedUsers(): DisplayUser[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onResetFilters(): void {
    this.filtroLegajo = '';
    this.filtroNombre = '';
    this.filtroApellido = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filtroLegajo?.trim() || this.filtroNombre?.trim() || this.filtroApellido?.trim() || this.filtroRol?.trim() || this.filtroEstado);
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

  // Obtener las opciones de roles para el select
  getRolesOptions(): { value: string; label: string }[] {
    return Object.entries(Roles)
      .filter(([key, value]) => typeof value === 'number' && key !== 'Administrativo')
      .map(([key, value]) => ({
        value: value.toString(),
        label: key === 'SuperAdmin' ? 'Super Admin' : key
      }));
  }

  // Helper para obtener nombre del rol por ID
  getRolNameById(rolId: number): string {
    const rol = this.getRolesOptions().find(r => Number(r.value) === rolId);
    return rol?.label || '';
  }

  editUser(item: DisplayUser): void {
    const id = item?.id ?? null;
    if (id == null) return;

    this.modalInitialData = null;
    this.modalMode = 'edit';
    this.showUserModal = true;

    this.userService.getUserById(Number(id)).subscribe({
      next: (resp) => {
        this.modalInitialData = resp?.data ?? resp ?? null;
      },
      error: (err) => {
        console.error('[UserList] error loading user by id', err);
        this.modalInitialData = item;
      }
    });
  }

  deleteUser(item: DisplayUser): void {
    const id = item?.id ?? null;
    if (id == null) return;

    this.alertService.confirm('¿Estás seguro de que deseas eliminar este usuario?', 'Eliminar Usuario')
      .then((result: any) => {
        if (result && result.isConfirmed) {
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

  toggleUserActive(item: DisplayUser): void {
    const id = item?.id ?? null;
    if (id == null) return;

    const current = item.activo;
    const targetState = !current;
    const actionText = targetState ? 'activar' : 'desactivar';

    this.alertService.confirm(`¿Estás seguro de que deseas ${actionText} este usuario?`, `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Usuario`)
      .then((result: any) => {
        if (result && result.isConfirmed) {
          this.userService.toggleActivo(Number(id)).subscribe({
            next: (resp) => {
              const pastText = targetState ? 'activado' : 'desactivado';
              this.alertService.success(`Usuario ${pastText} correctamente.`, '¡Hecho!');
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

  createNewUser(): void {
    this.modalInitialData = null;
    this.modalMode = 'create';
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
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
      this.userService.createUser(event.data).subscribe({
        next: (resp) => {
          this.fetchUsers();
          event.onSuccess();
        },
        error: (err) => {
          console.error('[UserList] createUser error', err);
          event.onError(err);
        }
      });
    } else {
      const id = Number(this.modalInitialData?.id ?? this.modalInitialData?.userId ?? null);
      if (!id) {
        console.warn('[UserList] update requested but no id available');
        event.onError({ message: 'No se pudo identificar el usuario a actualizar' });
        return;
      }
      this.userService.updateUser(id, event.data).subscribe({
        next: (resp) => {
          this.fetchUsers();
          event.onSuccess();
        },
        error: (err) => {
          console.error('[UserList] updateUser error', err);
          event.onError(err);
        }
      });
    }
  }

  private showSnack(message: string): void {
    console.log('SNACK:', message);
  }
}
