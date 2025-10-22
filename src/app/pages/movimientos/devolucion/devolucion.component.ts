import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { MovimientoService, CreateMovimientoDto } from '../../../services/movimiento.service';
import { AuthService } from '../../../services/auth.service';
import { PageTitleService } from '../../../services/page-title.service';

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
    private authService: AuthService,
    private pageTitleService: PageTitleService
  ) { }

  ngOnInit(): void {
    this.pageTitleService.setTitle('Devoluciones');
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

    this.movimientoService.getMovimientosByHerramienta(herramientaId).subscribe({
      next: (response) => {
        this.isLoadingMovimiento = false;
        if (response.success && response.data && response.data.length > 0) {
          // Get the most recent active loan (should be the last one)
          const lastMovimiento = response.data[response.data.length - 1];

          this.movimientoInfo = {
            idHerramienta: herramientaId,
            idUsuarioGenera: lastMovimiento.idUsuarioGenera,
            idUsuarioResponsable: lastMovimiento.idUsuarioResponsable || null,
            idTipoMovimiento: 2, // Devolución
            fechaMovimiento: new Date().toISOString(),
            fechaEstimadaDevolucion: "",
            idObra: lastMovimiento.idObra || null,
            idProveedor: lastMovimiento.idProveedor || null,
            observaciones: lastMovimiento.observaciones || '',
            // Display fields
            herramientaCodigo: this.selectedHerramientaInfo?.codigo,
            herramientaNombre: this.selectedHerramientaInfo?.nombre,
            usuarioNombre: lastMovimiento.usuarioResponsableNombre || lastMovimiento.usuarioNombre || 'N/A',
            usuarioApellido: lastMovimiento.usuarioResponsableApellido || lastMovimiento.usuarioApellido || '',
            usuarioLegajo: lastMovimiento.usuarioResponsableLegajo || lastMovimiento.usuarioLegajo || 'N/A',
            obraNombre: lastMovimiento.obraNombre || 'N/A'
          };
        } else {
          // No active loan found
          this.movimientoInfo = null;
          console.warn('No se encontró información de préstamo activo para esta herramienta');
        }
      },
      error: (error) => {
        this.isLoadingMovimiento = false;
        this.movimientoInfo = null;
        console.error('Error al cargar información del movimiento:', error);

        // Show error modal
        this.isSuccess = false;
        this.modalTitle = 'Error al Cargar Información';
        this.modalMessage = 'No se pudo cargar la información del préstamo de esta herramienta.';
        this.showModal = true;
      }
    });
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
        idUsuarioResponsable: this.movimientoInfo.idUsuarioResponsable || null,
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
