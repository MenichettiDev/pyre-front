import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "./shared/components/sidebar/sidebar.component";
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SidebarService } from './core/services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'pyre';

  selectedObjetivo: string = '';
  currentRoute: string = '';
  selectedFecha: string = '';
  selectedEstado: string = '';

  isLoggedIn: boolean = false; // Variable que guardará el estado de login
  isSidebarVisible: boolean = true; // Controla si el sidebar está visible (desde SidebarService)
  private loggedInSubscription!: Subscription;  // Usamos '!' para decirle a TypeScript que esta propiedad será inicializada más tarde
  private sidebarSubscription!: Subscription;

  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public authService: AuthService
    , private sidebarService: SidebarService
  ) {
    // Inicializar el estado desde el inicio
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    // Nos suscribimos al observable del servicio de autenticación para obtener el estado de login
    this.loggedInSubscription = this.authService.loggedIn$.subscribe(
      (loggedInStatus) => {
        this.isLoggedIn = loggedInStatus;
      }
    );

    // Suscribirse al estado del sidebar
    this.sidebarSubscription = this.sidebarService.visible$.subscribe(v => {
      this.isSidebarVisible = v;
    });
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción al destruir el componente
    if (this.loggedInSubscription) {
      this.loggedInSubscription.unsubscribe();
    }
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

}
