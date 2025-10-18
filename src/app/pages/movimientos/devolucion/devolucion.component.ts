import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { MovimientoService, CreateMovimientoDto } from '../../../services/movimiento.service';
import { AuthService } from '../../../services/auth.service';

interface MovimientoInfo {
  idHerramienta: number;
  idUsuarioGenera: number;
  idUsuarioResponsable: number;
  idTipoMovimiento: number;
  fechaMovimiento: string;
  fechaEstimadaDevolucion?: string;
  idEstadoHerramientaAlDevolver?: number;
  idObra?: number;
  idProveedor?: number;
  observaciones?: string;
  // Additional fields for display
  herramientaCodigo?: string;
  herramientaNombre?: string;
  usuarioNombre?: string;
  usuarioApellido?: string;
  usuarioLegajo?: string;
  obraNombre?: string;
}

@Component({
  selector: 'app-devolucion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CboHerramientasComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './devolucion.component.html',
  styleUrl: './devolucion.component.css'
})
export class DevolucionComponent implements OnInit {

  devolucionForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  movimientoInfo: MovimientoInfo | null = null;

  // Modal properties
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  isSuccess = false;
  isLoading = false;
  isLoadingMovimiento = false;

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.devolucionForm = this.fb.group({
      herramientaId: ['', Validators.required],
      fechaDevolucion: [this.getTodayDate(), Validators.required],
      observaciones: ['']
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onHerramientaSelected(herramienta: HerramientaOption | null): void {
    this.selectedHerramientaInfo = herramienta;
    this.movimientoInfo = null;

    if (herramienta) {
      console.log('Herramienta seleccionada:', herramienta);
      this.loadMovimientoInfo(herramienta.id);
    }
  }


  private loadMovimientoInfo(herramientaId: number): void {
    this.isLoadingMovimiento = true;

    // TODO: Replace with actual service call to get movement info by herramientaId
    // For now, simulate the API call
    setTimeout(() => {
      // Mock data - replace with actual service call
      this.movimientoInfo = {
        idHerramienta: herramientaId,
        idUsuarioGenera: 1,
        idUsuarioResponsable: 2,
        idTipoMovimiento: 1,
        fechaMovimiento: '2024-01-15',
        fechaEstimadaDevolucion: '2024-01-30',
        idObra: 1,
        observaciones: 'Préstamo para obra principal',
        // Display fields
        herramientaCodigo: this.selectedHerramientaInfo?.codigo,
        herramientaNombre: this.selectedHerramientaInfo?.nombre,
        usuarioNombre: 'Juan',
        usuarioApellido: 'Pérez',
        usuarioLegajo: 'EMP001',
        obraNombre: 'Obra Principal'
      };
      this.isLoadingMovimiento = false;
    }, 1000);

  }

  onSubmit(): void {
    if (this.devolucionForm.valid && this.movimientoInfo) {
      this.isLoading = true;

      const formData = this.devolucionForm.value;
      const currentUserId = this.authService.getUserId();

      if (!currentUserId) {
        this.isLoading = false;
        this.isSuccess = false;
        this.modalTitle = 'Error de Autenticación';
        this.modalMessage = 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.';
        this.showModal = true;
        return;
      }

      const devolucionData: CreateMovimientoDto = {
        idHerramienta: this.movimientoInfo.idHerramienta,
        idUsuarioGenera: currentUserId,
        idUsuarioResponsable: this.movimientoInfo.idUsuarioResponsable,
        idTipoMovimiento: 2, // Devolución
        fechaMovimiento: formData.fechaDevolucion,
        estadoHerramientaAlDevolver: formData.estadoFisicoId,
        idObra: this.movimientoInfo.idObra,
        idProveedor: this.movimientoInfo.idProveedor,
        observaciones: formData.observaciones || undefined,
      };
      console.log('Datos de devolución a enviar:', devolucionData);


      this.movimientoService.registrarDevolucion(devolucionData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.modalTitle = 'Devolución Registrada';
          this.modalMessage = `La devolución de la herramienta ${this.selectedHerramientaInfo?.codigo} ha sido registrada exitosamente.`;
          this.showModal = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.isSuccess = false;
          this.modalTitle = 'Error al Registrar Devolución';
          this.modalMessage = error.error?.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
          this.showModal = true;
          console.error('Error al crear devolución:', error);
        }
      });
    } else {
      this.devolucionForm.markAllAsTouched();
      console.log('Formulario inválido o falta información del movimiento');
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
    this.devolucionForm.reset();
    this.devolucionForm.patchValue({
      fechaDevolucion: this.getTodayDate()
    });
    this.selectedHerramientaInfo = null;
    this.movimientoInfo = null;
  }

  isFormValid(): boolean {
    return this.devolucionForm.valid && this.movimientoInfo !== null;
  }

  getDaysOverdue(): number {
    if (!this.movimientoInfo?.fechaEstimadaDevolucion) return 0;

    const today = new Date();
    const estimatedDate = new Date(this.movimientoInfo.fechaEstimadaDevolucion);
    const diffTime = today.getTime() - estimatedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  isOverdue(): boolean {
    return this.getDaysOverdue() > 0;
  }
}
