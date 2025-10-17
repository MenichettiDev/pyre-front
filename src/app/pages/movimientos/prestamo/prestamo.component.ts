import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CboUsuarioComponent, UsuarioOption } from "../../../shared/components/Cbo/cbo-usuario/cbo-usuario.component";
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { CboObraComponent, ObraOption } from '../../../shared/components/Cbo/cbo-obra/cbo-obra.component';

@Component({
  selector: 'app-prestamo',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CboHerramientasComponent,
    CboUsuarioComponent,
    CboObraComponent
  ],
  templateUrl: './prestamo.component.html',
  styleUrl: './prestamo.component.css'
})
export class PrestamoComponent implements OnInit {

  prestamoForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  selectedUsuarioInfo: UsuarioOption | null = null;
  selectedObraInfo: ObraOption | null = null;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.prestamoForm = this.fb.group({
      herramientaId: ['', Validators.required],
      responsableId: ['', Validators.required],
      fechaPrestamo: [this.getTodayDate(), Validators.required],
      fechaEstimadaDevolucion: ['', Validators.required],
      obraId: [''],
      prioridad: ['normal'],
      observaciones: ['']
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onHerramientaSelected(herramienta: HerramientaOption | null): void {
    this.selectedHerramientaInfo = herramienta;

    if (herramienta) {
      console.log('Herramienta seleccionada:', herramienta);
      // Update any additional UI or perform actions based on selection
    }
  }

  onUsuarioSelected(usuario: UsuarioOption | null): void {
    this.selectedUsuarioInfo = usuario;

    if (usuario) {
      console.log('Usuario seleccionado:', usuario);
      // Update any additional UI or perform actions based on selection
    }
  }

  onObraSelected(obra: ObraOption | null): void {
    this.selectedObraInfo = obra;

    if (obra) {
      console.log('Obra seleccionada:', obra);
      // Update any additional UI or perform actions based on selection
    }
  }

  onSubmit(): void {
    if (this.prestamoForm.valid) {
      const formData = this.prestamoForm.value;
      console.log('Datos del préstamo:', formData);
      // TODO: Implement loan creation logic
    } else {
      this.prestamoForm.markAllAsTouched();
      console.log('Formulario inválido');
    }
  }

  resetForm(): void {
    this.prestamoForm.reset();
    this.prestamoForm.patchValue({
      fechaPrestamo: this.getTodayDate(),
      prioridad: 'normal'
    });
    this.selectedHerramientaInfo = null;
    this.selectedUsuarioInfo = null;
    this.selectedObraInfo = null;
  }
}
