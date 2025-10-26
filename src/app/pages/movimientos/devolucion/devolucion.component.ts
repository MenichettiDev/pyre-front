import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { MovimientoService, CreateMovimientoDto } from '../../../services/movimiento.service';
import { AuthService } from '../../../services/auth.service';
import { PageTitleService } from '../../../services/page-title.service';
import { AlertaService } from '../../../services/alerta.service';

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
  ],
  templateUrl: './devolucion.component.html',
  styleUrls: ['../../../../styles/visor-style.css', '../../../../styles/movimientos-style.css', './devolucion.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DevolucionComponent implements OnInit {

  devolucionForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  movimientoInfo: MovimientoInfo | null = null;

  isLoading = false;
  isLoadingMovimiento = false;

  // Campos requeridos para calcular el progreso
  private requiredFields = ['herramientaId', 'estadoFisicoId'];

  // Placeholder original para observaciones
  private originalPlaceholder: string = 'Agregue cualquier detalle adicional sobre la devolución... (Opcional)';

  // Opciones para estado físico (ejemplo; adaptar según servicio si existe)
  estadoFisicoOptions = [
    { id: 1, nombre: 'Excelente' },
    { id: 2, nombre: 'Bueno' },
    { id: 3, nombre: 'Regular' },
    { id: 4, nombre: 'Malo' }
  ];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private authService: AuthService,
    private pageTitleService: PageTitleService,
    private alertService: AlertaService
  ) { }

  ngOnInit(): void {
    this.pageTitleService.setTitle('Registrar Devolución');
    this.buildForm();
    this.setupFormListeners();
    this.setInitialPlaceholder();
  }

  private buildForm(): void {
    this.devolucionForm = this.fb.group({
      herramientaId: ['', Validators.required],
      estadoFisicoId: ['', Validators.required],
      observaciones: ['', Validators.maxLength(500)]
    });
  }

  private setupFormListeners(): void {
    // Escuchar cambios en el formulario para actualizar el progreso en tiempo real
    this.devolucionForm.valueChanges.subscribe(() => {
      // Podrías agregar lógica adicional aquí si es necesario
    });
  }

  private setInitialPlaceholder(): void {
    setTimeout(() => {
      const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.placeholder = this.originalPlaceholder;
      }
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calcula el porcentaje de completitud del formulario
   */
  getFormCompletionPercentage(): number {
    let filledFields = 0;
    const totalFields = this.requiredFields.length;

    this.requiredFields.forEach(field => {
      const control = this.devolucionForm.get(field);
      if (control && control.value && control.valid) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
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

    this.movimientoService.getUltimoMovimientoByHerramienta(herramientaId).subscribe({
      next: (response) => {
        this.isLoadingMovimiento = false;
        if (response.success && response.data) {
          // Get the most recent active loan (should be the last one)
          const lastMovimiento = response.data;

          this.movimientoInfo = {
            idHerramienta: lastMovimiento.idHerramienta,
            idUsuarioGenera: lastMovimiento.idUsuarioGenera,
            idUsuarioResponsable: lastMovimiento.idUsuarioResponsable,
            idTipoMovimiento: lastMovimiento.idTipoMovimiento,
            fechaMovimiento: lastMovimiento.fecha,
            fechaEstimadaDevolucion: lastMovimiento.fechaEstimadaDevolucion,
            idObra: lastMovimiento.idObra,
            idProveedor: lastMovimiento.idProveedor,
            observaciones: lastMovimiento.observaciones || '',
            // Display fields
            herramientaCodigo: lastMovimiento.codigoHerramienta,
            herramientaNombre: lastMovimiento.nombreHerramienta,
            usuarioNombre: lastMovimiento.nombreUsuarioResponsable || 'N/A',
            usuarioApellido: '', // Not provided in API response
            usuarioLegajo: 'N/A', // Not provided in API response
            obraNombre: lastMovimiento.nombreObra || 'N/A'
          };
        } else {
          // No movements found
          this.movimientoInfo = null;
          console.warn('No se encontraron movimientos para esta herramienta');
        }
      },
      error: (error) => {
        this.isLoadingMovimiento = false;
        this.movimientoInfo = null;
        console.error('Error al cargar información del movimiento:', error);

        // Show error modal
        this.alertService.error('No se pudo cargar la información de devolución.', 'Error al Cargar Información');
      }
    });
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores
    if (this.devolucionForm.invalid) {
      this.devolucionForm.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    // Crear mensaje de confirmación con los datos esenciales de la devolución
    const confirmMessage = `¿Confirmar registro de devolución?<br><br>Herramienta: ${this.selectedHerramientaInfo?.nombre}<br>Fecha: ${this.devolucionForm.get('fechaDevolucion')?.value}`;

    this.alertService.confirm(confirmMessage, 'Confirmar Devolución').then((result) => {
      if (result.isConfirmed) {
        this.registrarDevolucion();
      }
    });
  }

  private registrarDevolucion(): void {
    this.isLoading = true;

    const formData = this.devolucionForm.value;
    const currentUserId = this.authService.getUserId();

    if (!currentUserId) {
      this.isLoading = false;
      this.alertService.error('No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.', 'Error de Autenticación');
      return;
    }

    if (!this.movimientoInfo) {
      this.isLoading = false;
      this.alertService.error('No se encontró información del movimiento. Por favor, seleccione una herramienta válida.', 'Error de Datos');
      return;
    }

    const devolucionData: CreateMovimientoDto = {
      idHerramienta: this.movimientoInfo.idHerramienta,
      idUsuarioGenera: currentUserId,
      idUsuarioResponsable: this.movimientoInfo.idUsuarioResponsable || null,
      idTipoMovimiento: 2, // Devolución
      fechaMovimiento: this.getTodayDate(), // Set to current date
      estadoHerramientaAlDevolver: formData.estadoFisicoId,
      idObra: this.movimientoInfo.idObra || undefined,
      idProveedor: this.movimientoInfo.idProveedor || undefined,
      observaciones: formData.observaciones || undefined,
      fechaEstimadaDevolucion: null
    };

    this.movimientoService.registrarDevolucion(devolucionData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.alertService.success(`La devolución de la herramienta ${this.selectedHerramientaInfo?.codigo} ha sido registrada exitosamente.`, '✓ Devolución Registrada');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.error(error.error?.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.', '✗ Error al Registrar');
        console.error('Error al crear devolución:', error);
      }
    });
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  /**
   * Hace scroll al primer campo con error
   */
  private scrollToFirstError(): void {
    const firstError = document.querySelector('.is-invalid, .has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  resetForm(): void {
    this.devolucionForm.reset();
    this.devolucionForm.patchValue({
      fechaDevolucion: this.getTodayDate()
    });
    this.selectedHerramientaInfo = null;
    this.movimientoInfo = null;
  }

  // Métodos para manejar el placeholder del textarea
  onTextareaFocus(): void {
    const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.placeholder = '';
    }
  }

  onTextareaBlur(): void {
    const control = this.devolucionForm.get('observaciones');
    if (!control?.value) {
      const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.placeholder = this.originalPlaceholder;
      }
    }
  }

  getDaysOverdue(): number {
    if (!this.movimientoInfo?.fechaEstimadaDevolucion) return 0;

    const today = new Date();
    // Parse the estimated date as UTC to avoid timezone issues
    const estimatedDate = new Date(this.movimientoInfo.fechaEstimadaDevolucion + (this.movimientoInfo.fechaEstimadaDevolucion.includes('Z') ? '' : 'Z'));
    const diffTime = today.getTime() - estimatedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  isOverdue(): boolean {
    return this.getDaysOverdue() > 0;
  }
}
