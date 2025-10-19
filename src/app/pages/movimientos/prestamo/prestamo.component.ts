import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { CboUsuarioComponent, UsuarioOption } from "../../../shared/components/Cbo/cbo-usuario/cbo-usuario.component";
import { CboHerramientasComponent, HerramientaOption } from '../../../shared/components/Cbo/cbo-herramientas/cbo-herramientas.component';
import { CboObraComponent, ObraOption } from '../../../shared/components/Cbo/cbo-obra/cbo-obra.component';
import { MovimientoService, CreateMovimientoDto } from '../../../services/movimiento.service';
import { AuthService } from '../../../services/auth.service';
import { PageTitleService } from '../../../services/page-title.service';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-prestamo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CboHerramientasComponent,
    CboUsuarioComponent,
    CboObraComponent,
  ],
  templateUrl: './prestamo.component.html',
  styleUrls: ['../../../../styles/visor-style.css', './prestamo.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PrestamoComponent implements OnInit {
  prestamoForm!: FormGroup;
  selectedHerramientaInfo: HerramientaOption | null = null;
  selectedUsuarioInfo: UsuarioOption | null = null;
  selectedObraInfo: ObraOption | null = null;

  isLoading = false;

  // Campos requeridos para calcular el progreso
  private requiredFields = ['herramientaId', 'responsableId', 'fechaPrestamo', 'fechaEstimadaDevolucion', 'obraId'];

  // Placeholder original para observaciones
  private originalPlaceholder: string = 'Agregue cualquier detalle adicional sobre el préstamo... (Opcional)';

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private authService: AuthService,
    private pageTitleService: PageTitleService,
    private alertService: AlertaService
  ) { }

  ngOnInit(): void {
    this.pageTitleService.setTitle('Registrar Préstamo');
    this.buildForm();
    this.setupFormListeners();
    this.setInitialPlaceholder();
  }

  private buildForm(): void {
    this.prestamoForm = this.fb.group({
      herramientaId: ['', Validators.required],
      responsableId: ['', Validators.required],
      fechaPrestamo: [this.getTodayDate(), Validators.required],
      fechaEstimadaDevolucion: ['', Validators.required],
      obraId: ['', Validators.required],
      observaciones: ['', Validators.maxLength(500)]
    });
  }

  private setupFormListeners(): void {
    // Escuchar cambios en el formulario para actualizar el progreso en tiempo real
    this.prestamoForm.valueChanges.subscribe(() => {
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
      const control = this.prestamoForm.get(field);
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
    const fechaPrestamo = this.prestamoForm.get('fechaPrestamo')?.value;
    const fechaDevolucion = this.prestamoForm.get('fechaEstimadaDevolucion')?.value;

    if (!fechaPrestamo || !fechaDevolucion) {
      return false;
    }

    const inicio = new Date(fechaPrestamo);
    const fin = new Date(fechaDevolucion);
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

  onUsuarioSelected(usuario: UsuarioOption | null): void {
    this.selectedUsuarioInfo = usuario;

    if (usuario) {
      console.log('Usuario seleccionado:', usuario);
    }
  }

  onObraSelected(obra: ObraOption | null): void {
    this.selectedObraInfo = obra;

    if (obra) {
      console.log('Obra seleccionada:', obra);
    }
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores
    if (this.prestamoForm.invalid) {
      this.prestamoForm.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    // Crear mensaje de confirmación con los datos esenciales del préstamo
    const confirmMessage = `¿Confirmar registro de préstamo?<br><br>Herramienta: ${this.selectedHerramientaInfo?.nombre}<br>Responsable: ${this.selectedUsuarioInfo?.nombre} ${this.selectedUsuarioInfo?.apellido}`;

    this.alertService.confirm(confirmMessage, 'Confirmar Préstamo').then((result) => {
      if (result.isConfirmed) {
        this.registrarPrestamo();
      }
    });
  }

  private registrarPrestamo(): void {
    this.isLoading = true;

    const formData = this.prestamoForm.value;
    const currentUserId = this.authService.getUserId();

    if (!currentUserId) {
      this.isLoading = false;
      this.alertService.error('No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.', 'Error de Autenticación');
      return;
    }

    const prestamoData: CreateMovimientoDto = {
      idHerramienta: formData.herramientaId,
      idUsuarioResponsable: formData.responsableId,
      idUsuarioGenera: currentUserId,
      idTipoMovimiento: 1, // Préstamo
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
        this.alertService.success(`El préstamo de la herramienta ${this.selectedHerramientaInfo?.codigo} ha sido registrado exitosamente.`, '✓ Préstamo Registrado');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.error(error.error?.message || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.', '✗ Error al Registrar');
        console.error('Error al crear préstamo:', error);
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
    this.prestamoForm.reset();
    this.prestamoForm.patchValue({
      fechaPrestamo: this.getTodayDate()
    });
    this.selectedHerramientaInfo = null;
    this.selectedUsuarioInfo = null;
    this.selectedObraInfo = null;
  }

  // Métodos para manejar el placeholder del textarea
  onTextareaFocus(): void {
    const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.placeholder = '';
    }
  }

  onTextareaBlur(): void {
    const control = this.prestamoForm.get('observaciones');
    if (!control?.value) {
      const textarea = document.querySelector('textarea[formControlName="observaciones"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.placeholder = this.originalPlaceholder;
      }
    }
  }
}
