import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Roles } from '../../../shared/enums/roles';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.css']
})
export class UserModalComponent implements OnInit, OnChanges {
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
  rolesList: Array<{ id: number; label: string }> = [];
  showPassword = false;
  showConfirm = false;
  // Controla si los campos están habilitados para edición en modo 'edit'
  editingEnabled: boolean = true;

  // ✅ Guardar el ID del usuario para edición
  private userId: number | null = null;

  @ViewChild('firstInput') firstInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private alertService: AlertService
  ) {}

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.onCancel();
  }

  ngOnInit(): void {
    this.buildForm();
    this.updatePasswordValidators(); // ✅ Configurar validaciones iniciales
    if (this.initialData) this.patchForm(this.initialData);
    this.initRoles();

    // Inicializar estado de edición según modo
    this.editingEnabled = this.mode !== 'edit';
    this.setControlsDisabled(!this.editingEnabled);

    // Focus management - focus the first input after view initialization
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
      // actualizar estado de edición cuando cambie el modo
      this.editingEnabled = this.mode !== 'edit';
      this.setControlsDisabled(!this.editingEnabled);
    }
  }

  // Activa la edición de los campos en modo 'edit'
  enableEditing(): void {
    this.editingEnabled = true;
    this.setControlsDisabled(false);
    // poner foco en el primer input editable
    setTimeout(() => {
      const firstInput = this.elementRef.nativeElement.querySelector('input:not([disabled])');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  // Alterna entre modo lectura y edición desde el header
  toggleEditing(): void {
    this.editingEnabled = !this.editingEnabled;
    this.setControlsDisabled(!this.editingEnabled);
    if (this.editingEnabled) {
      // focus al primer input editable
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
    // En modo edit, las contraseñas siguen vacías y opcionales hasta que el usuario las ingrese
    if (this.mode === 'edit' && disabled) {
      // dejar Password y PasswordConfirm deshabilitados visualmente
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      Nombre: ['', [Validators.required]],
      Apellido: ['', [Validators.required]],
      Legajo: ['', [Validators.required]],
      Dni: ['', [Validators.required]],
      Email: ['', [Validators.required, Validators.email]],
      Telefono: [''],
      RolId: [Roles.Administrativo, [Validators.required]],
      AccedeAlSistema: [true],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      PasswordConfirm: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private updatePasswordValidators() {
    const passwordControl = this.form.get('Password');
    const passwordConfirmControl = this.form.get('PasswordConfirm');

    if (this.mode === 'edit') {
      // ✅ En modo edición: contraseña opcional
      passwordControl?.setValidators([Validators.minLength(6)]);
      passwordConfirmControl?.setValidators([Validators.minLength(6)]);
    } else {
      // ✅ En modo creación: contraseña obligatoria
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
      passwordConfirmControl?.setValidators([Validators.required, Validators.minLength(6)]);
    }

    passwordControl?.updateValueAndValidity();
    passwordConfirmControl?.updateValueAndValidity();
  }

  private initRoles() {
    // Build roles list from enum (exclude reverse numeric keys)
    this.rolesList = Object.keys(Roles)
      .filter(k => Number.isNaN(Number(k)))
      .map(name => ({ id: (Roles as any)[name] as number, label: name }));
  }

  private patchForm(data: any) {
    if (!this.form) this.buildForm();

    console.log('🔍 Patching form with data:', data); // Debug log

    // ✅ Guardar el ID del usuario para edición
    this.userId = data?.id ?? data?.Id ?? data?.usuario_id ?? null;
    console.log('💾 User ID saved:', this.userId);

    const mapped = {
      // ✅ Mapeo actualizado según respuesta del backend
      Nombre: data?.nombre ?? data?.Nombre ?? '',
      Apellido: data?.apellido ?? data?.Apellido ?? '',
      Legajo: data?.legajo ?? data?.Legajo ?? '',
      Dni: data?.dni ?? data?.Dni ?? '',
      Email: data?.email ?? data?.Email ?? '',
      Telefono: data?.telefono ?? data?.Telefono ?? '',
      // Para RolId necesitamos mapear desde rolNombre o crear un mapeo
      RolId: this.getRolIdFromRolNombre(data?.rolNombre) ?? data?.RolId ?? data?.rolId ?? Roles.Administrativo,
      AccedeAlSistema: data?.accedeAlSistema ?? data?.AccedeAlSistema ?? true,
      Password: '', // Siempre vacío para seguridad
      PasswordConfirm: '' // Siempre vacío para seguridad
    };

    console.log('✅ Mapped data for form:', mapped); // Debug log
    this.form.patchValue(mapped);

    // ✅ Actualizar validaciones después de patchear
    this.updatePasswordValidators();
  }

  private getRolIdFromRolNombre(rolNombre: string): number | null {
    // Mapear nombres de roles a IDs del enum
    const roleMap: {[key: string]: number} = {
      'SuperAdmin': Roles.SuperAdmin,
      'Administrativo': Roles.Administrativo,
      'Supervisor': Roles.Supervisor,
      'Operario': Roles.Operario
    };
    return roleMap[rolNombre] ?? null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const pw = this.form.get('Password')?.value;
    const pwc = this.form.get('PasswordConfirm')?.value;

    // ✅ Validar contraseñas solo si se proporcionaron
    if (pw || pwc) {
      if (pw !== pwc) {
        // marcar errores simples en los controles
        this.form.get('Password')?.setErrors({ mismatch: true });
        this.form.get('PasswordConfirm')?.setErrors({ mismatch: true });
        this.form.get('Password')?.markAsTouched();
        this.form.get('PasswordConfirm')?.markAsTouched();
        return;
      }
    }

    // Preparar datos para envío
    const { PasswordConfirm, ...formData } = this.form.value;

    // ✅ En modo edición, solo incluir Password si tiene valor
    const value = { ...formData };
    if (this.mode === 'edit' && !pw) {
      delete value.Password; // No enviar campo Password vacío
    }

    // ✅ En modo edición, incluir el ID del usuario
    if (this.mode === 'edit' && this.userId) {
      value.Id = this.userId; // ⚠️ Incluir ID para validación del backend
      console.log('🔄 Including user ID in update:', this.userId);
    }

    console.log('📤 Final data being sent:', value); // Debug: ver datos finales

    this.submit.emit({
      mode: this.mode,
      data: value,
      onSuccess: () => {
        this.alertService.success(
          `El usuario ha sido ${this.mode === 'create' ? 'creado' : 'actualizado'} exitosamente`,
          `¡Usuario ${this.mode === 'create' ? 'Creado' : 'Actualizado'}!`
        );
        this.resetModal(); // ✅ Limpiar estado al completar
        this.visible = false;
        this.close.emit();
      },
      onError: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Ocurrió un error inesperado';
        this.alertService.error(
          `Error al ${this.mode === 'create' ? 'crear' : 'actualizar'} el usuario: ${errorMessage}`,
          `Error al ${this.mode === 'create' ? 'Crear' : 'Actualizar'} Usuario`
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
    this.userId = null; // ✅ Limpiar ID al cerrar
    this.form?.reset();
  }
}
