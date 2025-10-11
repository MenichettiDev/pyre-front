import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AlertaService } from '../../../../services/alerta.service';

export interface ObraDto {
  idObra: number;
  codigo: string;
  nombreObra: string;
  ubicacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

@Component({
  selector: 'app-modal-obras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-obras.component.html',
  styleUrls: ['./modal-obras.component.css']
})
export class ModalObrasComponent implements OnInit, OnChanges {
  @Output() submit = new EventEmitter<{
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }>();
  @Output() close = new EventEmitter<void>();

  @Input() initialData: ObraDto | null = null;
  @Input() mode: 'create' | 'edit' = 'create';

  visible = true;
  form!: FormGroup;
  editingEnabled: boolean = true;
  private obraId: number | null = null;

  @ViewChild('firstInput') firstInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private alertService: AlertaService
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
      if (firstInput) {
        firstInput.focus();
      }
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
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombreObra: ['', [Validators.required, Validators.maxLength(150)]],
      ubicacion: ['', [Validators.maxLength(200)]],
      fechaInicio: [''],
      fechaFin: ['']
    });
  }

  private patchForm(data: any) {
    if (!this.form) this.buildForm();
    this.obraId = data?.idObra ?? null;
    const mapped = {
      codigo: data?.codigo ?? '',
      nombreObra: data?.nombreObra ?? '',
      ubicacion: data?.ubicacion ?? '',
      fechaInicio: data?.fechaInicio ?? '',
      fechaFin: data?.fechaFin ?? ''
    };
    this.form.patchValue(mapped);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...this.form.value };
    if (this.mode === 'edit' && this.obraId) {
      value.idObra = this.obraId;
    }
    this.submit.emit({
      mode: this.mode,
      data: value,
      onSuccess: () => {
        this.alertService.success(
          `La obra ha sido ${this.mode === 'create' ? 'creada' : 'actualizada'} exitosamente`,
          `¡Obra ${this.mode === 'create' ? 'Creada' : 'Actualizada'}!`
        );
        this.resetModal();
        this.visible = false;
        this.close.emit();
      },
      onError: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Ocurrió un error inesperado';
        this.alertService.error(
          `Error al ${this.mode === 'create' ? 'crear' : 'actualizar'} la obra: ${errorMessage}`,
          `Error al ${this.mode === 'create' ? 'Crear' : 'Actualizar'} Obra`
        );
      }
    });
  }

  onCancel(): void {
    this.resetModal();
    this.close.emit();
    this.visible = false;
  }

  private resetModal(): void {
    this.obraId = null;
    this.form?.reset();
  }
}
