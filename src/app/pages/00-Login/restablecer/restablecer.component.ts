import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restablecer',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './restablecer.component.html',
  styleUrls: ['./restablecer.component.css']
})
export class RestablecerComponent implements OnInit {

  resetForm: FormGroup;
  errorMessage: string | null = null;
  isDarkMode: boolean = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    // No additional initialization needed
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const { email } = this.resetForm.value;

      // Simulate API call for password reset
      this.http.post('/api/restablecer', { email }).subscribe({
        next: () => {
          alert('Se ha enviado un enlace de restablecimiento a tu correo.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al enviar el enlace de restablecimiento:', error);
          this.errorMessage = 'Hubo un problema al enviar el enlace. Por favor, intente nuevamente.';
          alert(this.errorMessage);
        }
      });
    } else {
      // Mark fields as touched
      Object.keys(this.resetForm.controls).forEach(field => {
        const control = this.resetForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });

      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      alert(this.errorMessage);
    }
  }

  closeReset(): void {
    this.router.navigate(['/']); // Navigate to home page
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    const root = document.documentElement;
    if (this.isDarkMode) {
      root.style.setProperty('--background-color', '#121212');
      root.style.setProperty('--text-color', '#e0e0e0');
    } else {
      root.style.setProperty('--background-color', 'var(--light-background-color)');
      root.style.setProperty('--text-color', 'var(--light-text-color)');
    }
  }
}
