import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from "./shared/sidebar/sidebar.component";
import { Subscription } from 'rxjs';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
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
  private loggedInSubscription!: Subscription;  // Usamos '!' para decirle a TypeScript que esta propiedad será inicializada más tarde

  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    // Nos suscribimos al observable del servicio de autenticación para obtener el estado de login
    this.loggedInSubscription = this.authService.loggedIn$.subscribe(
      (loggedInStatus) => {
        this.isLoggedIn = loggedInStatus;
      }
    );
  }

  ngOnDestroy(): void {
    // Limpiamos la suscripción al destruir el componente
    if (this.loggedInSubscription) {
      this.loggedInSubscription.unsubscribe();
    }
  }

}
