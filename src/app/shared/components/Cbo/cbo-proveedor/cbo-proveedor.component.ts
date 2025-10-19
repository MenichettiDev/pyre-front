import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject } from 'rxjs';
import { ProveedorService } from '../../../services/proveedor.service';

@Component({
  selector: 'app-cbo-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cbo-proveedor.component.html',
  styleUrls: ['./cbo-proveedor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboProveedorComponent),
      multi: true
    }
  ]
})
export class CboProveedorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() isLabel: string = '';
  @Input() isId: string = 'proveedor-select';
  @Input() isDisabled: boolean = false;
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;

  @Output() proveedorSelected = new EventEmitter<any>();

  // Internal state
  proveedores: any[] = [];
  selectedProveedor: any = null;
  searchControl = new FormControl('');
  isOpen = false;
  isLoading = false;
  placeholder = 'Seleccionar proveedor...';

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => { };
  private onTouched = () => { };

  constructor(private proveedorService: ProveedorService) { }

  ngOnInit(): void {
    this.setupSearch();
    this.loadProveedores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && value !== this.selectedProveedor) {
      this.selectedProveedor = value;
      this.updatePlaceholder();
    }
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

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (!searchTerm || searchTerm.length < 2) {
          return of([]);
        }
        this.isLoading = true;
        return this.proveedorService.searchProveedores(searchTerm, this.showOnlyActive).pipe(
          catchError(error => {
            console.error('Error searching proveedores:', error);
            return of([]);
          })
        );
      })
    ).subscribe(proveedores => {
      this.proveedores = proveedores;
      this.isLoading = false;
    });
  }

  private loadProveedores(): void {
    this.isLoading = true;
    this.proveedorService.getProveedores(this.showOnlyActive).pipe(
      catchError(error => {
        console.error('Error loading proveedores:', error);
        return of([]);
      })
    ).subscribe(proveedores => {
      this.proveedores = proveedores;
      this.isLoading = false;
    });
  }

  onMainInputClick(): void {
    if (!this.isDisabled) {
      this.toggleDropdown();
    }
  }

  onMainInputFocus(): void {
    if (!this.isDisabled && !this.isOpen) {
      this.isOpen = true;
      this.loadProveedores();
    }
  }

  onMainInputBlur(): void {
    setTimeout(() => {
      if (this.isOpen) {
        this.isOpen = false;
        this.updatePlaceholder();
      }
    }, 200);
  }

  onMainInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchControl.setValue(target.value);
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.isDisabled) return;

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadProveedores();
    } else {
      this.updatePlaceholder();
    }
  }

  onOptionClick(proveedor: any): void {
    this.selectedProveedor = proveedor;
    this.isOpen = false;
    this.updatePlaceholder();

    // Emit events
    this.proveedorSelected.emit(proveedor);
    this.onChange(proveedor);
    this.onTouched();
  }

  clearSelection(): void {
    this.selectedProveedor = null;
    this.searchControl.setValue('');
    this.updatePlaceholder();

    // Emit events
    this.proveedorSelected.emit(null);
    this.onChange(null);
    this.onTouched();
  }

  private updatePlaceholder(): void {
    if (this.selectedProveedor) {
      this.placeholder = this.selectedProveedor.nombre || 'Proveedor seleccionado';
    } else {
      this.placeholder = 'Seleccionar proveedor...';
    }
  }

  trackByProveedor(index: number, proveedor: any): any {
    return proveedor.id || proveedor.idProveedor || index;
  }

  hasErrors(): boolean {
    return this.objectErrors && Object.keys(this.objectErrors).length > 0;
  }

  getErrorMessage(): string {
    if (!this.hasErrors()) return '';

    const errors = this.objectErrors;
    if (errors.required) return 'Este campo es requerido';
    if (errors.invalid) return 'Selección inválida';

    return 'Error en la selección';
  }
}
