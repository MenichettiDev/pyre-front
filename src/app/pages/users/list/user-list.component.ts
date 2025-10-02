import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

abstract class UserService {
	// Método mínimo esperado por el componente. En la aplicación real este servicio debe estar definido/proporcionado en otro sitio.
	abstract getUsers(page: number, size: number): any;
}

interface User {
	id: number;
	name?: string;
	email?: string;
	// ...añadir otros campos que use la app si es necesario...
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  currentPage = 1;
  pageSize = 10;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.userService.getUsers(this.currentPage, this.pageSize).subscribe(
      (response: { data: User[] }) => {
        this.users = response.data;
      },
      (error: any) => {
        console.error('Error fetching users:', error);
        this.showSnack('Error al cargar los usuarios. Por favor, inténtelo de nuevo.');
      }
    );
  }

  editUser(id: number): void {
    console.log(`Editar usuario con ID: ${id}`);
  }

  deleteUser(id: number): void {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este usuario?');
    if (confirmed) {
      console.log(`Usuario con ID ${id} eliminado.`);
      // Aquí puedes llamar al servicio para eliminar el usuario
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchUsers();
    }
  }

  nextPage(): void {
    this.currentPage++;
    this.fetchUsers();
  }

  changePage(newPage: number): void {
    if (newPage > 0) {
      this.currentPage = newPage;
      this.fetchUsers();
    }
  }

  // Implementación local simple para reemplazar MatSnackBar durante edición rápida en el editor.
  private showSnack(message: string): void {
    // En ejecución real puedes volver a usar MatSnackBar; aquí se usa console para evitar la dependencia.
    console.log('SNACK:', message);
  }
}
