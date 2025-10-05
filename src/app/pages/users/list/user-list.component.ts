import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { TableSharedComponent } from '../../../shared/components/table-shared/table-shared.component';

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
  imports: [CommonModule, RouterModule, TableSharedComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  providers: [UserService]
})
export class UserListComponent implements OnInit {
  users: DisplayUser[] = [];
  columns: string[] = ['legajo','nombre','apellido','rol','estado'];
  rowsPerPageOptions: number[] = [5,10,20,40];
  currentPage = 1;
  pageSize = 5;
  loading = false;
  totalItems = 0;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    console.log(`[UserList] fetchUsers page=${this.currentPage} size=${this.pageSize}`);
    this.userService.getUsers(this.currentPage, this.pageSize).subscribe(
      (resp) => {
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

  // Ahora recibimos el objeto emitido por la tabla y extraemos el id
  editUser(item: any): void {
    const id = item?.id ?? null;
    if (id == null) return;
    this.router.navigate(['/user/create'], { queryParams: { id } });
  }

  deleteUser(item: any): void {
    const id = item?.id ?? null;
    if (id == null) return;
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este usuario?');
    if (confirmed) {
      console.log(`Usuario con ID ${id} eliminado.`);
      // Aquí puedes llamar al servicio para eliminar el usuario
    }
  }

  // Handler para el paginator externo (app-paginator)
  onPageChange(event: { pageIndex: number; pageSize: number }) {
    console.log(`[UserList] external onPageChange pageIndex=${event.pageIndex} pageSize=${event.pageSize}`);
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchUsers();
  }



  // Implementación local simple para reemplazar MatSnackBar durante edición rápida en el editor.
  private showSnack(message: string): void {
    // En ejecución real puedes volver a usar MatSnackBar; aquí se usa console para evitar la dependencia.
    console.log('SNACK:', message);
  }
}
