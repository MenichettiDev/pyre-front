import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-form-global-selected',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './form-global-selected.component.html',
  styleUrls: ['./form-global-selected.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormGlobalSelectedComponent),
      multi: true
    }
  ]
})
export class FormGlobalSelectedComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl
  internalControl = new FormControl();

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Required inputs
  @Input() isLoadding: boolean = false;
  @Input() objectErrors: any = null;
  @Input() isLabel: string = '';
  @Input() isTouched: boolean = false;
  @Input() dtListaData: any[] = [];
  @Input() isTextLabel: string = '';
  @Input() isKeyValue: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;

  // Output for touched state
  @Output() isEmiterTouched = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.setupInternalControlSubscription();
    this.updateDisabledState();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupInternalControlSubscription(): void {
    // Value changes with debounce
    const valueChangeSub = this.internalControl.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.onChange(value);
      });

    this.subscriptions.push(valueChangeSub);
  }

  private updateDisabledState(): void {
    if (this.isDisabled) {
      this.internalControl.disable({ emitEvent: false });
    } else {
      this.internalControl.enable({ emitEvent: false });
    }
  }

  // Handle select events
  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    // Convert to appropriate type based on data
    const convertedValue = this.convertValue(value);
    this.internalControl.setValue(convertedValue, { emitEvent: false });
    this.onChange(convertedValue);
  }

  onSelectBlur(): void {
    this.onTouched();
    this.isEmiterTouched.emit(true);
  }

  onSelectFocus(): void {
    // Optional: handle focus events if needed
  }

  // Convert string value to appropriate type
  private convertValue(value: string): any {
    if (!value || value === '') return null;

    // Try to convert to number if it looks like a number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    return value;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.internalControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.updateDisabledState();
  }

  // Helper methods for template
  hasErrors(): boolean {
    return !!(this.objectErrors && (this.isTouched || this.internalControl.touched));
  }

  getErrorMessage(): string {
    if (!this.hasErrors()) return '';

    if (this.objectErrors?.required) {
      return `${this.isLabel} es requerido`;
    }

    // Handle other error types if needed
    if (typeof this.objectErrors === 'string') {
      return this.objectErrors;
    }

    return 'Campo inválido';
  }

  // Check if field should show as invalid
  isInvalid(): boolean {
    return this.hasErrors();
  }

  // Get the display value for selected option
  getDisplayValue(item: any): string {
    if (!item || !this.isTextLabel) return '';
    return item[this.isTextLabel] || '';
  }

  // Get the key value for selected option
  getKeyValue(item: any): any {
    if (!item || !this.isKeyValue) return null;
    return item[this.isKeyValue];
  }
}
