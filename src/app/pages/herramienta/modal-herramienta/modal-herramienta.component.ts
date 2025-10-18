import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-herramientas-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './modal-herramienta.component.html',
  styleUrls: ['./modal-herramienta.component.css']
})
export class HerramientasModalComponent implements OnInit, OnChanges, OnDestroy {
  @Output() submit = new EventEmitter<{
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }>();
  @Output() close = new EventEmitter<void>();

  @Input() initialData: any | null = null;
  @Input() mode: 'create' | 'edit' = 'create';

  visible = true;
  form!: FormGroup;
  showAdvanced = false;
  serverErrors: { [key: string]: string } = {};
  private subscriptions: Subscription[] = [];
  editingEnabled: boolean = true;
  private toolId: number | null = null;

  @ViewChild('firstInput') firstInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private srvAlerta: AlertaService
  ) { }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.onCancel();
  }

  ngOnInit(): void {
    this.buildForm();
    if (this.initialData) this.patchForm(this.initialData);

    this.editingEnabled = this.mode !== 'edit';
    this.setControlsDisabled(!this.editingEnabled);

    setTimeout(() => {
      const firstInput = this.elementRef.nativeElement.querySelector('input:not([style*="display:none"])');
      if (firstInput) firstInput.focus();
    }, 150);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && !changes['initialData'].firstChange) {
      this.patchForm(this.initialData);
    }
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.mode = changes['mode'].currentValue || 'create';
      this.editingEnabled = this.mode !== 'edit';
      this.setControlsDisabled(!this.editingEnabled);
    }
  }

  enableEditing(): void {
    this.editingEnabled = true;
    this.setControlsDisabled(false);
    setTimeout(() => {
      const firstInput = this.elementRef.nativeElement.querySelector('input:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  toggleEditing(): void {
    this.editingEnabled = !this.editingEnabled;
    this.setControlsDisabled(!this.editingEnabled);
    if (this.editingEnabled) {
      setTimeout(() => {
        const firstInput = this.elementRef.nativeElement.querySelector('input:not([disabled])');
        if (firstInput) firstInput.focus();
      }, 50);
    }
  }

  private setControlsDisabled(disabled: boolean) {
    if (!this.form) return;
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (!control) return;
      if (disabled) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      Codigo: ['', [Validators.required, Validators.maxLength(20)]],
      Nombre: ['', [Validators.required, Validators.maxLength(100)]],
      Marca: ['', [Validators.maxLength(50)]],
      Tipo: ['', [Validators.maxLength(50)]],
      EstadoFisico: ['', [Validators.required]],
      Disponibilidad: ['', [Validators.required]],
      Ubicacion: ['', [Validators.maxLength(100)]],
      Planta: ['', [Validators.maxLength(50)]]
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Log para depuración de los valores del formulario al enviar
    console.debug('[HerramientasModal] Valores del formulario al enviar:', this.form.value);

    const formValue = { ...this.form.value };

    // En modo edición, asegurarse de que el ID esté incluido
    if (this.mode === 'edit' && this.toolId) {
      formValue.Id = this.toolId;
      formValue.idHerramienta = this.toolId;
    }

    console.debug('[HerramientasModal] Datos del formulario para enviar al backend:', formValue);

    this.submit.emit({
      mode: this.mode,
      data: formValue,
      onSuccess: () => {
        this.srvAlerta.success(
          `La herramienta ha sido ${this.mode === 'create' ? 'creada' : 'actualizada'} exitosamente`,
          `¡Herramienta ${this.mode === 'create' ? 'Creada' : 'Actualizada'}!`
        );
        this.resetModal();
        this.visible = false;
        this.close.emit();
      },
      onError: (error: any) => {
        console.error('[HerramientasModal] Error en la operación:', error);
        let errorMessage = 'Ocurrió un error inesperado';

        // Intentar obtener un mensaje de error significativo
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error?.error === 'string') {
          errorMessage = error.error;
        } else if (error?.statusText) {
          errorMessage = `Error: ${error.statusText}`;
        }

        this.srvAlerta.error(
          `Error al ${this.mode === 'create' ? 'crear' : 'actualizar'} la herramienta: ${errorMessage}`,
          `Error al ${this.mode === 'create' ? 'Crear' : 'Actualizar'} Herramienta`
        );

        this.handleServerErrors(error);
      }
    });
  }

  onCancel(): void {
    this.resetModal();
    this.close.emit();
    this.visible = false;
  }

  private resetModal(): void {
    this.toolId = null;
    this.form?.reset();
  }

  private handleServerErrors(error: any) {
    try {
      this.serverErrors = {};

      // Normalizar el formato del error para diferentes tipos de respuestas
      let errorData = error?.error;

      // Si el error es una cadena, intentar analizarla como JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData);
        } catch (e) {
          // Si no es JSON, crear un objeto simple con el mensaje
          errorData = { message: errorData };
        }
      }

      // Manejar errores de validación específicos
      if (errorData?.errors && typeof errorData.errors === 'object') {
        Object.keys(errorData.errors).forEach((k: string) => {
          const val = errorData.errors[k];
          this.serverErrors[k] = Array.isArray(val) ? String(val[0]) : String(val);

          // Mapear errores del backend a campos del formulario
          const formField = this.fromServerKey(k);
          const control = this.form.get(formField);

          if (control) {
            control.setErrors({ server: true });
            control.markAsTouched();
          } else {
            console.warn(`[HerramientasModal] No se encontró control para el campo: ${k} -> ${formField}`);
          }
        });
      }
      // Manejar mensaje de error general
      else if (errorData?.message || errorData?.detail) {
        const generalError = errorData?.message || errorData?.detail;
        this.serverErrors['general'] = generalError;

        // Mostrar el mensaje de error general
        this.srvAlerta.error(generalError);
      }
      // Manejar error de texto simple
      else if (typeof error?.error === 'string') {
        this.serverErrors['general'] = error.error;
      }

    } catch (e) {
      console.error('[HerramientasModal] Error al procesar respuesta del servidor:', e);
      this.srvAlerta.error('Ocurrió un error al procesar la respuesta del servidor');
    }
  }

  // Mapeo de nombres de campos del servidor al formulario
  private fromServerKey(serverKey: string): string {
    const map: any = {
      'NombreHerramienta': 'Nombre',
      'Codigo': 'Codigo',
      'Marca': 'Marca',
      'Tipo': 'Tipo',
      'EstadoFisico': 'EstadoFisico',
      'Disponibilidad': 'Disponibilidad',
      'Ubicacion': 'Ubicacion',
      'Planta': 'Planta'
    };
    return map[serverKey] ?? serverKey;
  }

  // Mapeo de nombres de campos del formulario al servidor
  private toServerKey(formKey: string): string {
    const map: any = {
      'Nombre': 'NombreHerramienta',
      'Codigo': 'Codigo',
      'Marca': 'Marca',
      'Tipo': 'Tipo',
      'EstadoFisico': 'EstadoFisico',
      'Disponibilidad': 'Disponibilidad',
      'Ubicacion': 'Ubicacion',
      'Planta': 'Planta'
    };
    return map[formKey] ?? formKey;
  }

  private patchForm(data: any) {
    if (!this.form) this.buildForm();

    // Guardar el ID de la herramienta para actualización posterior
    this.toolId = data?.id ?? data?.Id ?? data?.idHerramienta ?? null;

    console.debug('[HerramientasModal] Datos recibidos para patchForm:', data);

    // Mapeo mejorado para considerar todas las variantes de nombres de propiedades
    const mapped = {
      Codigo: data?.codigo ?? data?.Codigo ?? '',
      Nombre: data?.nombreHerramienta ?? data?.nombre ?? data?.Nombre ?? '',
      Marca: data?.marca ?? data?.Marca ?? '',
      Tipo: data?.tipo ?? data?.Tipo ?? '',
      // Asegurar que el estadoFisico se cargue correctamente con todas las variantes posibles
      EstadoFisico: data?.estadoFisico ?? data?.EstadoFisico ?? data?.estado_fisico ?? data?.estadoFisicoHerramienta ?? '',
      Disponibilidad: data?.estadoDisponibilidad ?? data?.disponibilidad ?? data?.Disponibilidad ?? '',
      Ubicacion: data?.ubicacion ?? data?.ubicacionFisica ?? data?.Ubicacion ?? '',
      Planta: data?.nombrePlanta ?? data?.planta ?? data?.Planta ?? ''
    };

    console.debug('[HerramientasModal] Valores mapeados para el formulario:', mapped);
    console.debug('[HerramientasModal] Estado físico encontrado:', mapped.EstadoFisico);
    this.form.patchValue(mapped);

    // Verificar si el estado físico se estableció correctamente
    setTimeout(() => {
      const estadoFisicoControl = this.form.get('EstadoFisico');
      if (estadoFisicoControl && !estadoFisicoControl.value && mapped.EstadoFisico) {
        console.warn('[HerramientasModal] Reintentando establecer estado físico:', mapped.EstadoFisico);
        estadoFisicoControl.setValue(mapped.EstadoFisico, { emitEvent: false });
      }
    }, 100);
  }
}
