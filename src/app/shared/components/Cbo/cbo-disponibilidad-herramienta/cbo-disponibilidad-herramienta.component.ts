import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject } from 'rxjs';
import { DisponibilidadHerramientaService } from '../../../../services/disponibilidad-herramienta.service';

@Component({
  selector: 'app-cbo-disponibilidad-herramienta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cbo-disponibilidad-herramienta.component.html',
  styleUrls: ['./cbo-disponibilidad-herramienta.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboDisponibilidadHerramientaComponent),
      multi: true
    }
  ]
})
export class CboDisponibilidadHerramientaComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() isLabel: string = '';
  @Input() isId: string = 'disponibilidad-select';
  @Input() isDisabled: boolean = false;
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;

  @Output() disponibilidadSelected = new EventEmitter<any>();

  // Internal state
  disponibilidades: any[] = [];
  selectedDisponibilidad: any = null;
  searchControl = new FormControl('');
  isOpen = false;
  isLoading = false;
  placeholder = 'Seleccionar disponibilidad...';

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => { };
  private onTouched = () => { };

  constructor(private disponibilidadService: DisponibilidadHerramientaService) { }

  ngOnInit(): void {
    this.setupSearch();
    this.loadDisponibilidades();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && value !== this.selectedDisponibilidad) {
      this.selectedDisponibilidad = value;
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
          return of(this.disponibilidades);
        }
        this.isLoading = true;
        return this.searchDisponibilidades(searchTerm);
      })
    ).subscribe((disponibilidades: any) => {
      if (!this.searchControl.value || this.searchControl.value.length < 2) {
        // Don't update if it's just the initial load
      } else {
        this.disponibilidades = disponibilidades || [];
      }
      this.isLoading = false;
    });
  }

  private searchDisponibilidades(searchTerm: string) {
    return this.disponibilidadService.getDisponibilidades().pipe(
      switchMap(response => {
        const rawList = response.data || [];

        // Filter client-side by search term
        const filteredList = rawList.filter((disponibilidad: any) => {
          const descripcion = (disponibilidad.descripcionEstado || '').toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return descripcion.includes(searchLower);
        });

        return of(filteredList);
      }),
      catchError(error => {
        console.error('Error searching disponibilidades:', error);
        return of([]);
      })
    );
  }

  private loadDisponibilidades(): void {
    this.isLoading = true;
    this.disponibilidadService.getDisponibilidades().pipe(
      catchError(error => {
        console.error('Error loading disponibilidades:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      this.disponibilidades = response.data || [];
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
      this.loadDisponibilidades();
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
      this.loadDisponibilidades();
    } else {
      this.updatePlaceholder();
    }
  }

  onOptionClick(disponibilidad: any): void {
    this.selectedDisponibilidad = disponibilidad;
    this.isOpen = false;
    this.updatePlaceholder();

    // Emit events
    this.disponibilidadSelected.emit(disponibilidad);
    this.onChange(disponibilidad);
    this.onTouched();
  }

  clearSelection(): void {
    this.selectedDisponibilidad = null;
    this.searchControl.setValue('');
    this.updatePlaceholder();

    // Emit events
    this.disponibilidadSelected.emit(null);
    this.onChange(null);
    this.onTouched();
  }

  private updatePlaceholder(): void {
    if (this.selectedDisponibilidad) {
      this.placeholder = this.selectedDisponibilidad.descripcionEstado || 'Disponibilidad seleccionada';
    } else {
      this.placeholder = 'Seleccionar disponibilidad...';
    }
  }

  trackByDisponibilidad(index: number, disponibilidad: any): any {
    return disponibilidad.idEstadoDisponibilidad || index;
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
