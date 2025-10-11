import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-tool-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './tool-modal.component.html',
  styleUrls: ['./tool-modal.component.css']
})
export class ToolModalComponent implements OnInit, OnChanges, OnDestroy {
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

  private handleServerErrors(error: any) {
    try {
      this.serverErrors = {};
      const payload = error?.error ?? error;
      if (payload?.errors && typeof payload.errors === 'object') {
        Object.keys(payload.errors).forEach((k: string) => {
          const val = payload.errors[k];
          this.serverErrors[k] = Array.isArray(val) ? String(val[0]) : String(val);
          const control = this.form.get(k) || this.form.get(this.toFormKey(k));
          if (control) {
            control.setErrors({ server: true });
            control.markAsTouched();
          }
        });
        return;
      }
      const msg = payload?.message || payload?.detail || payload?.error;
      if (msg && typeof msg === 'string') {
        this.srvAlerta.error(msg);
      }
    } catch (e) {
      this.srvAlerta.error('Ocurrió un error al procesar la respuesta del servidor');
    }
  }

  private toFormKey(serverKey: string): string {
    const map: any = {
      'codigo': 'Codigo',
      'nombre': 'Nombre',
      'marca': 'Marca',
      'tipo': 'Tipo',
      'estadoFisico': 'EstadoFisico',
      'disponibilidad': 'Disponibilidad',
      'ubicacion': 'Ubicacion',
      'planta': 'Planta'
    };
    return map[serverKey] ?? serverKey;
  }

  private patchForm(data: any) {
    if (!this.form) this.buildForm();
    this.toolId = data?.id ?? data?.Id ?? null;
    const mapped = {
      Codigo: data?.codigo ?? data?.Codigo ?? '',
      Nombre: data?.nombre ?? data?.Nombre ?? '',
      Marca: data?.marca ?? data?.Marca ?? '',
      Tipo: data?.tipo ?? data?.Tipo ?? '',
      EstadoFisico: data?.estadoFisico ?? data?.EstadoFisico ?? '',
      Disponibilidad: data?.disponibilidad ?? data?.Disponibilidad ?? '',
      Ubicacion: data?.ubicacion ?? data?.Ubicacion ?? '',
      Planta: data?.planta ?? data?.Planta ?? ''
    };
    this.form.patchValue(mapped);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...this.form.value };
    if (this.mode === 'edit' && this.toolId) {
      value.Id = this.toolId;
    }
    this.submit.emit({
      mode: this.mode,
      data: value,
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
        const errorMessage = error?.error?.message || error?.message || 'Ocurrió un error inesperado';
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
}
