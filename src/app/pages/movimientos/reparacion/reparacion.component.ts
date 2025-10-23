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
import { CboProveedorComponent } from "../../../shared/components/Cbo/cbo-proveedor/cbo-proveedor.component";


@Component({
  selector: 'app-reparacion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CboHerramientasComponent,
    CboProveedorComponent
  ],
  templateUrl: './reparacion.component.html',
  styleUrls: ['../../../../styles/visor-style.css', '../../../../styles/movimientos-style.css', './reparacion.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ReparacionComponent implements OnInit {
  reparacionForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  selectedProveedorInfo: any | null = null;

  isLoading = false;
  isLoadingMovimiento = false;

  // Campos requeridos para calcular el progreso
  private requiredFields = ['herramientaId', 'proveedorId', 'fechaReparacion', 'fechaEstimadaFinalizacion'];

  // Placeholder original para observaciones
  private originalPlaceholder: string = 'Agregue cualquier detalle adicional sobre la reparación... (Opcional)';

  // Opciones para estado físico (ejemplo; no usado en reparación pero para consistencia)
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
    this.pageTitleService.setTitle('Registrar Reparación');
    this.buildForm();
    this.setupFormListeners();
    this.setInitialPlaceholder();
  }

  private buildForm(): void {
    this.reparacionForm = this.fb.group({
      herramientaId: ['', Validators.required],
      proveedorId: ['', Validators.required],
      fechaReparacion: [this.getTodayDate(), Validators.required],
      fechaEstimadaFinalizacion: ['', Validators.required],
      observaciones: ['', Validators.maxLength(500)]
    });
  }

  private setupFormListeners(): void {
    // Escuchar cambios en el formulario para actualizar el progreso en tiempo real
    this.reparacionForm.valueChanges.subscribe(() => {
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
      const control = this.reparacionForm.get(field);
      if (control && control.value && control.valid) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Verifica si el rango de fechas excede los 30 días recomendados
   */
  isDaysExceeded(): boolean {
    const fechaReparacion = this.reparacionForm.get('fechaReparacion')?.value;
    const fechaFinalizacion = this.reparacionForm.get('fechaEstimadaFinalizacion')?.value;

    if (!fechaReparacion || !fechaFinalizacion) {
      return false;
    }

    const inicio = new Date(fechaReparacion);
    const fin = new Date(fechaFinalizacion);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 30;
  }

  onHerramientaSelected(herramienta: HerramientaOption | null): void {
    this.selectedHerramientaInfo = herramienta;

    if (herramienta) {
      console.log('Herramienta seleccionada:', herramienta);
    }
  }

  onProveedorSelected(proveedor: any | null): void {
    this.selectedProveedorInfo = proveedor;

    if (proveedor) {
      console.log('Proveedor seleccionado:', proveedor);
    }
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores
    if (this.reparacionForm.invalid) {
      this.reparacionForm.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    // Crear mensaje de confirmación con los datos esenciales de la reparación
    const confirmMessage = `¿Confirmar registro de reparación?<br><br>Herramienta: ${this.selectedHerramientaInfo?.nombre}<br>Proveedor: ${this.selectedProveedorInfo?.nombreProveedor}`;

    this.alertService.confirm(confirmMessage, 'Confirmar Reparación').then((result) => {
      if (result.isConfirmed) {
        this.registrarReparacion();
      }
    });
  }

  private registrarReparacion(): void {
    this.isLoading = true;

    const formData = this.reparacionForm.value;
    const currentUserId = this.authService.getUserId();

    if (!currentUserId) {
      this.isLoading = false;
      this.alertService.error('No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.', 'Error de Autenticación');
      return;
    }

    const reparacionData: CreateMovimientoDto = {
      idHerramienta: formData.herramientaId,
      idUsuarioGenera: currentUserId,
      idUsuarioResponsable: null, // Para reparaciones no hay usuario responsable
      idTipoMovimiento: 3, // Reparación
      fechaMovimiento: formData.fechaReparacion, // Fecha cuando se registra la reparación
      fechaEstimadaDevolucion: formData.fechaEstimadaFinalizacion,
      estadoHerramientaAlDevolver: 0, // Estado inicial
      idObra: 0, // No aplica para reparaciones
      idProveedor: formData.proveedorId.idProveedor, // El ID del proveedor seleccionado
      observaciones: formData.observaciones || undefined,
    };

    this.movimientoService.registrarPrestamo(reparacionData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.alertService.success(`La reparación de la herramienta ${this.selectedHerramientaInfo?.codigo} ha sido registrada exitosamente.`, '✓ Reparación Registrada');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.error(error.error?.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.', '✗ Error al Registrar');
        console.error('Error al crear reparación:', error);
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
    this.reparacionForm.reset();
    this.reparacionForm.patchValue({
      fechaReparacion: this.getTodayDate()
    });
    this.selectedHerramientaInfo = null;
    this.selectedProveedorInfo = null;
  }

  // Métodos para manejar el placeholder del textarea
  onTextareaFocus(): void {
    const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.placeholder = '';
    }
  }

  onTextareaBlur(): void {
    const control = this.reparacionForm.get('observaciones');
    if (!control?.value) {
      const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.placeholder = this.originalPlaceholder;
      }
    }
  }

  getDaysOverdue(): number {
    // Para reparación, no aplica overdue ya que es futuro
    return 0;
  }

  isOverdue(): boolean {
    // Para reparación, no aplica overdue
    return false;
  }
}
