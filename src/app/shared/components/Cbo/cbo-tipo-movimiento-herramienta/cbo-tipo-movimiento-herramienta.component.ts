import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject } from 'rxjs';
import { TipoMovimientoHerramientaService } from '../../../../services/tipo-movimiento-herramienta.service';

@Component({
  selector: 'app-cbo-tipo-movimiento-herramienta',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  @Input() isLabel: string = '';
  @Input() isId: string = 'tipo-movimiento-select';
  @Input() isDisabled: boolean = false;
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;

  @Output() tipoMovimientoSelected = new EventEmitter<any>();

  // Internal state
  tiposMovimiento: any[] = [];
  selectedTipoMovimiento: any = null;
  searchControl = new FormControl('');
  isOpen = false; // Start collapsed
  isLoading = false;
  placeholder = 'Seleccionar tipo de movimiento...';

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => { };
  private onTouched = () => { };

  constructor(private tipoMovimientoService: TipoMovimientoHerramientaService) { }

  ngOnInit(): void {
    this.setupSearch();
    this.loadTiposMovimiento();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && value !== this.selectedTipoMovimiento) {
      this.selectedTipoMovimiento = value;
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
          return of(this.tiposMovimiento);
        }
        this.isLoading = true;
        return this.searchTiposMovimiento(searchTerm);
      })
    ).subscribe((tipos: any) => {
      if (!this.searchControl.value || this.searchControl.value.length < 2) {
        // Don't update if it's just the initial load
      } else {
        this.tiposMovimiento = tipos || [];
      }
      this.isLoading = false;
    });
  }

  private searchTiposMovimiento(searchTerm: string) {
    return this.tipoMovimientoService.getTiposMovimiento().pipe(
      switchMap(response => {
        const rawList = response.data || [];

        // Filter client-side by search term
        const filteredList = rawList.filter((tipoMovimiento: any) => {
          const nombre = (tipoMovimiento.nombreTipoMovimiento || '').toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return nombre.includes(searchLower);
        });

        return of(filteredList);
      }),
      catchError(error => {
        console.error('Error searching tipos movimiento:', error);
        return of([]);
      })
    );
  }

  private loadTiposMovimiento(): void {
    this.isLoading = true;
    this.tipoMovimientoService.getTiposMovimiento().pipe(
      catchError(error => {
        console.error('Error loading tipos movimiento:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      this.tiposMovimiento = response.data || [];
      this.isLoading = false;
    });
  }

  onMainInputClick(): void {
    if (!this.isDisabled) {
      this.openDropdown();
    }
  }

  onMainInputFocus(): void {
    if (!this.isDisabled && !this.isOpen) {
      this.isOpen = true;
      this.loadTiposMovimiento();
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

  private openDropdown(): void {
    this.isOpen = true;
    this.loadTiposMovimiento();
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholder();
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.isDisabled) return;

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadTiposMovimiento();
    } else {
      this.updatePlaceholder();
    }
  }

  onOptionClick(tipoMovimiento: any): void {
    this.selectedTipoMovimiento = tipoMovimiento;
    this.isOpen = false;
    this.updatePlaceholder();

    // Emit events
    this.tipoMovimientoSelected.emit(tipoMovimiento);
    this.onChange(tipoMovimiento);
    this.onTouched();
  }

  clearSelection(): void {
    this.selectedTipoMovimiento = null;
    this.searchControl.setValue('');
    this.updatePlaceholder();

    // Emit events
    this.tipoMovimientoSelected.emit(null);
    this.onChange(null);
    this.onTouched();
  }

  private updatePlaceholder(): void {
    if (this.selectedTipoMovimiento) {
      this.placeholder = this.selectedTipoMovimiento.nombreTipoMovimiento || 'Tipo seleccionado';
    } else {
      this.placeholder = 'Seleccionar tipo de movimiento...';
    }
  }

  trackByTipoMovimiento(index: number, tipo: any): any {
    return tipo.idTipoMovimiento || index;
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
