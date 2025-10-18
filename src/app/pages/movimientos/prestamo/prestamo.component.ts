import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CboUsuarioComponent, UsuarioOption } from "../../../shared/components/Cbo/cbo-usuario/cbo-usuario.component";
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { CboObraComponent, ObraOption } from '../../../shared/components/Cbo/cbo-obra/cbo-obra.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { MovimientoService, CreateMovimientoDto } from '../../../services/movimiento.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-prestamo',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CboHerramientasComponent,
    CboUsuarioComponent,
    CboObraComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './prestamo.component.html',
  styleUrls: ['../../../../styles/visor-style.css'], // Enlace al archivo de estilos
})
export class PrestamoComponent implements OnInit {

  prestamoForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  selectedUsuarioInfo: UsuarioOption | null = null;
  selectedObraInfo: ObraOption | null = null;

  // Modal properties
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  isSuccess = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.prestamoForm = this.fb.group({
      herramientaId: ['', Validators.required],
      responsableId: ['', Validators.required],
      fechaPrestamo: [this.getTodayDate(), Validators.required],
      fechaEstimadaDevolucion: ['', Validators.required],
      obraId: ['', Validators.required],
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
      this.isLoading = true;

      const formData = this.prestamoForm.value;
      const currentUserId = this.authService.getUserId();

      if (!currentUserId) {
        this.isLoading = false;
        this.isSuccess = false;
        this.modalTitle = 'Error de Autenticación';
        this.modalMessage = 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.';
        this.showModal = true;
        return;
      }

      const prestamoData: CreateMovimientoDto = {
        idHerramienta: formData.herramientaId,
        idUsuarioResponsable: formData.responsableId,
        idUsuarioGenera: currentUserId,
        idTipoMovimiento: 1, //  "Préstamo"
        fechaMovimiento: formData.fechaPrestamo,
        fechaEstimadaDevolucion: formData.fechaEstimadaDevolucion,
        estadoHerramientaAlDevolver: formData.estadoFisicoHerramientaId,
        idObra: formData.obraId,
        idProveedor: formData.proveedorId || null,
        observaciones: formData.observaciones || undefined,
      };


      this.movimientoService.registrarPrestamo(prestamoData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.modalTitle = 'Préstamo Registrado';
          this.modalMessage = `El préstamo de la herramienta ${this.selectedHerramientaInfo?.codigo} ha sido registrado exitosamente.`;
          this.showModal = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.modalTitle = 'Error al Registrar Préstamo';
          this.modalMessage = error.error?.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
          this.showModal = true;
          console.error('Error al crear préstamo:', error);
        }
      });
    } else {
      this.prestamoForm.markAllAsTouched();
      console.log('Formulario inválido');
    }
  }

  onModalConfirm(): void {
    this.showModal = false;
    if (this.isSuccess) {
      this.resetForm();
    }
  }

  onModalCancel(): void {
    this.showModal = false;
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
