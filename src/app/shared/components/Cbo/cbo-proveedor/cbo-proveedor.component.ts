import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subscription, map } from 'rxjs';
import { ProveedoresService } from '../../../../services/proveedores.service';

export interface ProveedorOption {
  idProveedor: number;
  nombreProveedor: string;
  contacto: string;
  cuit: string;
  email: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cbo-proveedor.component.html',
  styleUrls: ['./cbo-proveedor.component.css', '../cbo.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboProveedorComponent),
      multi: true
    }
  ]
})
export class CboProveedorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<ProveedorOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = 'proveedor-select';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar proveedor...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() proveedorSelected = new EventEmitter<ProveedorOption | null>();

  // Component state
  proveedores: ProveedorOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedProveedor: ProveedorOption | null = null;

  constructor(private proveedorService: ProveedoresService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialProveedores();
    this.updateDisabledState();
    this.updatePlaceholderText();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSearchSubscription(): void {
    const searchSub = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!this.isOpen) {
            return of([] as ProveedorOption[]);
          }
          const searchTerm = (term || '').toString().trim();
          if (searchTerm.length >= 1) {
            return this.searchProveedores(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([] as ProveedorOption[]);
          }
        })
      )
      .subscribe(proveedores => {
        this.proveedores = Array.isArray(proveedores) ? proveedores : [];
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialProveedores(): void {
    this.loadInitialData().subscribe(proveedores => {
      this.proveedores = Array.isArray(proveedores) ? proveedores : [];
    });
  }

  private loadInitialData() {
    this.isLoading = true;
    return this.proveedorService.getProveedoresCombo()
      .pipe(
        map(response => {
          const rawList = response.data || [];
          const mapped = this.mapProveedoresToOptions(rawList);
          this.isLoading = false;
          return mapped as ProveedorOption[];
        }),
        catchError(error => {
          console.error('Error loading proveedores:', error);
          this.isLoading = false;
          return of([] as ProveedorOption[]);
        })
      );
  }

  private searchProveedores(searchTerm: string) {
    this.isLoading = true;
    return this.proveedorService.getProveedoresCombo(searchTerm)
      .pipe(
        map(response => {
          const rawList = response.data || [];
          const mapped = this.mapProveedoresToOptions(rawList);
          this.isLoading = false;
          return mapped;
        }),
        catchError(error => {
          console.error('Error searching proveedores:', error);
          this.isLoading = false;
          return of([] as ProveedorOption[]);
        })
      );
  }

  private mapProveedoresToOptions(proveedores: any[]): ProveedorOption[] {
    return proveedores.map(p => ({
      idProveedor: p.idProveedor || p.id,
      nombreProveedor: p.nombreProveedor || '',
      contacto: p.contacto || '',
      cuit: p.cuit || '',
      email: p.email || '',
      activo: p.activo !== false,
      displayText: this.buildDisplayText(p)
    }));
  }

  private buildDisplayText(proveedor: any): string {
    const nombre = proveedor.nombreProveedor || '';
    const contacto = proveedor.contacto ? ` - ${proveedor.contacto}` : '';
    return `${nombre}${contacto}`;
  }

  // Input interaction methods (copied from herramientas component)
  onMainInputClick(): void {
    if (this.isDisabled) return;

    if (!this.isOpen) {
      this.openDropdown();
    }
  }

  onMainInputFocus(): void {
    if (this.isDisabled) return;

    if (!this.isOpen) {
      this.openDropdown();
    }
  }

  onMainInputBlur(): void {
    // Delay to allow option clicks
    setTimeout(() => {
      if (this.isOpen) {
        this.closeDropdown();
      }
      this.onTouched();
      this.isEmiterTouched.emit(true);
    }, 150);
  }

  onMainInputChange(event: Event): void {
    if (!this.isOpen) return;

    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchControl.setValue(value, { emitEvent: true });
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isDisabled) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    this.isOpen = true;

    // Load initial data when opening
    this.loadInitialData().subscribe(proveedores => {
      this.proveedores = proveedores;
    });

    // Clear search when opening if no selection
    if (!this.selectedProveedor) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(proveedor: ProveedorOption): void {
    this.selectProveedor(proveedor);
    this.closeDropdown();
  }

  private selectProveedor(proveedor: ProveedorOption | null): void {
    this.selectedProveedor = proveedor;
    this.selectedControl.setValue(proveedor);

    if (proveedor) {
      this.onChange(proveedor);
    } else {
      this.onChange(null);
    }

    this.proveedorSelected.emit(proveedor);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectProveedor(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialProveedores();
  }

  private updatePlaceholderText(): void {
    if (this.selectedProveedor) {
      this.placeholder = this.selectedProveedor.displayText;
    } else {
      this.placeholder = 'Seleccionar proveedor...';
    }
  }

  private updateDisabledState(): void {
    if (this.isDisabled) {
      this.searchControl.disable({ emitEvent: false });
      this.selectedControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
      this.selectedControl.enable({ emitEvent: false });
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'object') {
      this.selectProveedor(value);
    } else {
      this.selectProveedor(null);
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
    this.updateDisabledState();
  }

  // Helper methods for template
  hasErrors(): boolean {
    return !!(this.objectErrors && (this.isTouched || this.selectedControl.touched));
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

  trackByProveedor(index: number, proveedor: ProveedorOption): number {
    return proveedor.idProveedor;
  }
}
