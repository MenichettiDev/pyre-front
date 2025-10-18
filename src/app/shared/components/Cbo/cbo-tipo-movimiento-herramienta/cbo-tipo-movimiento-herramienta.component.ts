import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { TipoMovimientoHerramientaService, TipoMovimientoDto } from '../../../../services/tipo-movimiento-herramienta.service';

export interface TipoMovimientoOption {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-tipo-movimiento-herramienta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-tipo-movimiento-herramienta.component.html',
  styleUrls: ['./cbo-tipo-movimiento-herramienta.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboTipoMovimientoHerramientaComponent),
      multi: true
    }
  ]
})
export class CboTipoMovimientoHerramientaComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<TipoMovimientoOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar tipo de movimiento...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() tipoMovimientoSelected = new EventEmitter<TipoMovimientoOption | null>();

  // Component state
  tiposMovimiento: TipoMovimientoOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedTipoMovimiento: TipoMovimientoOption | null = null;

  constructor(private tipoMovimientoService: TipoMovimientoHerramientaService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialTiposMovimiento();
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
          // Only search when dropdown is open
          if (!this.isOpen) {
            return of([]);
          }

          const searchTerm = (term || '').toString().trim();

          if (searchTerm.length >= 2) {
            return this.searchTiposMovimiento(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(tiposMovimiento => {
        this.tiposMovimiento = tiposMovimiento;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialTiposMovimiento(): void {
    this.loadInitialData().subscribe(tiposMovimiento => {
      this.tiposMovimiento = tiposMovimiento;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.tipoMovimientoService.getTiposMovimientoPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          let tiposMovimiento = this.mapTiposMovimientoToOptions(rawList);

          // Filter only active if required
          if (this.showOnlyActive) {
            tiposMovimiento = tiposMovimiento.filter(t => t.activo);
          }

          this.isLoading = false;
          return of(tiposMovimiento);
        }),
        catchError(error => {
          console.error('Error loading tipos movimiento:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchTiposMovimiento(searchTerm: string) {
    this.isLoading = true;

    return this.tipoMovimientoService.getTiposMovimientoPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((tipo: any) => {
            const nombre = (tipo.nombre || '').toLowerCase();
            const descripcion = (tipo.descripcion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return nombre.includes(searchLower) || descripcion.includes(searchLower);
          });

          let tiposMovimiento = this.mapTiposMovimientoToOptions(filteredList);

          // Filter only active if required
          if (this.showOnlyActive) {
            tiposMovimiento = tiposMovimiento.filter(t => t.activo);
          }

          this.isLoading = false;
          return of(tiposMovimiento);
        }),
        catchError(error => {
          console.error('Error searching tipos movimiento:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapTiposMovimientoToOptions(tiposMovimiento: any[]): TipoMovimientoOption[] {
    return tiposMovimiento.map(t => ({
      id: t.id,
      nombre: t.nombre || '',
      descripcion: t.descripcion || '',
      activo: t.activo !== false,
      displayText: this.buildDisplayText(t)
    }));
  }

  private buildDisplayText(tipoMovimiento: any): string {
    const nombre = tipoMovimiento.nombre;
    const descripcion = tipoMovimiento.descripcion;

    let text = nombre;
    if (descripcion && descripcion !== nombre) {
      text += ` - ${descripcion}`;
    }
    return text;
  }

  // Input interaction methods
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
    this.loadInitialData().subscribe(tiposMovimiento => {
      this.tiposMovimiento = tiposMovimiento;
    });

    // Clear search when opening if no selection
    if (!this.selectedTipoMovimiento) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(tipoMovimiento: TipoMovimientoOption): void {
    this.selectTipoMovimiento(tipoMovimiento);
    this.closeDropdown();
  }

  private selectTipoMovimiento(tipoMovimiento: TipoMovimientoOption | null): void {
    this.selectedTipoMovimiento = tipoMovimiento;
    this.selectedControl.setValue(tipoMovimiento);

    if (tipoMovimiento) {
      this.onChange(tipoMovimiento.id);
    } else {
      this.onChange(null);
    }

    this.tipoMovimientoSelected.emit(tipoMovimiento);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectTipoMovimiento(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialTiposMovimiento();
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

  private updatePlaceholderText(): void {
    if (this.selectedTipoMovimiento) {
      this.placeholder = this.selectedTipoMovimiento.displayText;
    } else {
      this.placeholder = 'Seleccionar tipo de movimiento...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findTipoMovimientoById(value);
    } else if (value && typeof value === 'object') {
      this.selectTipoMovimiento(value);
    } else {
      this.selectTipoMovimiento(null);
    }
  }

  private findTipoMovimientoById(id: number): void {
    // First check if it's in current list
    const found = this.tiposMovimiento.find(t => t.id === id);
    if (found) {
      this.selectTipoMovimiento(found);
      return;
    }

    // If not found, make a specific request
    this.tipoMovimientoService.getTipoMovimientoById(id).subscribe({
      next: (response) => {
        const tipoMovimientoData = response.data || response;
        if (tipoMovimientoData) {
          const tipoMovimiento = this.mapTiposMovimientoToOptions([tipoMovimientoData])[0];
          this.selectTipoMovimiento(tipoMovimiento);
        }
      },
      error: () => {
        // If request fails, just set the ID
        this.onChange(id);
      }
    });
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

  trackByTipoMovimiento(index: number, tipoMovimiento: TipoMovimientoOption): number {
    return tipoMovimiento.id;
  }
}
