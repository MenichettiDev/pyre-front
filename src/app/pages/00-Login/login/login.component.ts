import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { LoginService } from '../../../service/login.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  errorMessage: string | null = null;
  isDarkMode: boolean = true;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      contrasenia: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { usuario, contrasenia } = this.loginForm.value;

      this.loginService.login(usuario, contrasenia).subscribe({
        next: (response) => {
          // Save token and user data
          this.authService.saveAuthData(response.token, response.usuario);

          // Redirect to home
          this.router.navigate(['/inicio/home']);
        },
        error: (error) => {
          console.error('Error al iniciar sesión:', error);

          if (error.status === 401) {
            this.errorMessage = 'Credenciales incorrectas.';
          } else {
            this.errorMessage = 'Hubo un problema al intentar iniciar sesión. Por favor, intente nuevamente.';
          }
        }
      });
    } else {
      // Mark fields as touched
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return control?.invalid && control?.touched ? true : false;
  }

  closeLogin() {
    this.router.navigate(['/']);
  }

}