import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RolUsuarioService, RolDto } from '../../../../services/rol-usuario.service';

@Component({
  selector: 'app-cbo-rol-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './cbo-rol-usuario.component.html',
  styleUrls: ['./cbo-rol-usuario.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboRolUsuarioComponent),
      multi: true
    }
  ]
})
export class CboRolUsuarioComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar rol...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() rolSelected = new EventEmitter<RolDto | null>();

  // Component state
  roles: RolDto[] = [];
  selectedRolId: number | null = null;

  constructor(private rolService: RolUsuarioService) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadRoles(): void {
    this.rolService.getRoles().subscribe({
      next: (response) => {
        this.roles = response.data || [];
        // Filter only active if required and field exists
        if (this.showOnlyActive) {
          this.roles = this.roles.filter(r => r.activo !== false);
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
      }
    });
  }

  onSelectionChange(_: Event | null = null): void {
    // El value ya está sincronizado por [(ngModel)] en this.selectedRolId.
    // Evitar leer event.target.value cuando se usan [ngValue] u objetos.
    const val = this.selectedRolId !== undefined && this.selectedRolId !== null ? this.selectedRolId : null;
    this.onChange(val);
    this.onTouched();
    this.isEmiterTouched.emit(true);
    const selectedRol = this.roles.find(r => r.idRol === val) || null;
    this.rolSelected.emit(selectedRol);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
  this.selectedRolId = value !== undefined && value !== null ? +value : null;
}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Helper methods for template
  hasErrors(): boolean {
    return !!(this.objectErrors && (this.isTouched || this.selectedRolId !== null));
  }

  getErrorMessage(): string {
    if (!this.hasErrors()) return '';

    if (this.objectErrors?.required) {
      return `${this.isLabel} es requerido`;
    }

    if (typeof this.objectErrors === 'string') {
      return this.objectErrors;
    }

    return 'Campo inválido';
  }
}
