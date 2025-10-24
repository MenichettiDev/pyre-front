import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-cbo-estado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './cbo-estado.component.html',
  styleUrls: ['./cbo-estado.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboEstadoComponent),
      multi: true
    }
  ]
})
export class CboEstadoComponent implements ControlValueAccessor {

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Todos los estados';
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() estadoSelected = new EventEmitter<string | null>();

  // Component state
  selectedEstado: string = '';

  onSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedEstado = target.value;
    this.onChange(this.selectedEstado);
    this.onTouched();
    this.isEmiterTouched.emit(true);
    this.estadoSelected.emit(this.selectedEstado);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedEstado = value !== undefined && value !== null ? value : '';
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
    return !!(this.objectErrors && (this.isTouched || this.selectedEstado !== null));
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
