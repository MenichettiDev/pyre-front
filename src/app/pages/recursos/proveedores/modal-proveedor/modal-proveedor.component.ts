import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AlertaService } from '../../../../services/alerta.service';

export interface ProveedorDto {
  idProveedor: number;
  nombreProveedor: string;
  contacto: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

@Component({
  selector: 'app-modal-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-proveedor.component.html',
  styleUrls: ['./modal-proveedor.component.css']
})
export class ModalProveedorComponent implements OnInit, OnChanges {
  @Output() submit = new EventEmitter<{
    mode: 'create' | 'edit';
    data: any;
    onSuccess: () => void;
    onError: (error: any) => void;
  }>();
  @Output() close = new EventEmitter<void>();

  @Input() initialData: ProveedorDto | null = null;
  @Input() mode: 'create' | 'edit' = 'create';

  visible = true;
  form!: FormGroup;
  showPassword = false; // No se usa pero se deja por compatibilidad
  editingEnabled: boolean = true;
  private proveedorId: number | null = null;

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
      nombreProveedor: ['', [Validators.required]],
      contacto: ['', [Validators.required]],
      cuit: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      activo: [true, [Validators.required]]
    });
  }

  private patchForm(data: any) {
    if (!this.form) this.buildForm();
    this.proveedorId = data?.idProveedor ?? null;
    const mapped = {
      nombreProveedor: data?.nombreProveedor ?? '',
      contacto: data?.contacto ?? '',
      cuit: data?.cuit ?? '',
      telefono: data?.telefono ?? '',
      email: data?.email ?? '',
      direccion: data?.direccion ?? '',
      activo: data?.activo ?? true
    };
    this.form.patchValue(mapped);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = { ...this.form.value };
    if (this.mode === 'edit' && this.proveedorId) {
      value.idProveedor = this.proveedorId;
    }
    this.submit.emit({
      mode: this.mode,
      data: value,
      onSuccess: () => {
        this.alertService.success(
          `El proveedor ha sido ${this.mode === 'create' ? 'creado' : 'actualizado'} exitosamente`,
          `¡Proveedor ${this.mode === 'create' ? 'Creado' : 'Actualizado'}!`
        );
        this.resetModal();
        this.visible = false;
        this.close.emit();
      },
      onError: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Ocurrió un error inesperado';
        this.alertService.error(
          `Error al ${this.mode === 'create' ? 'crear' : 'actualizar'} el proveedor: ${errorMessage}`,
          `Error al ${this.mode === 'create' ? 'Crear' : 'Actualizar'} Proveedor`
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
    this.proveedorId = null;
    this.form?.reset();
  }
}
