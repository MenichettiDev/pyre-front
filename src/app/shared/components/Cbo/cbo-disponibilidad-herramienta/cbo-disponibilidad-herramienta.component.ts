import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { DisponibilidadHerramientaService, DisponibilidadDto } from '../../../../services/disponibilidad-herramienta.service';

export interface DisponibilidadOption {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-disponibilidad-herramienta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
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

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<DisponibilidadOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar disponibilidad...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() disponibilidadSelected = new EventEmitter<DisponibilidadOption | null>();

  // Component state
  disponibilidades: DisponibilidadOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedDisponibilidad: DisponibilidadOption | null = null;

  constructor(private disponibilidadService: DisponibilidadHerramientaService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialDisponibilidades();
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
            return this.searchDisponibilidades(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(disponibilidades => {
        this.disponibilidades = disponibilidades;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialDisponibilidades(): void {
    this.loadInitialData().subscribe(disponibilidades => {
      this.disponibilidades = disponibilidades;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.disponibilidadService.getDisponibilidadesPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          let disponibilidades = this.mapDisponibilidadesToOptions(rawList);

          // Filter only active if required
          if (this.showOnlyActive) {
            disponibilidades = disponibilidades.filter(d => d.activo);
          }

          this.isLoading = false;
          return of(disponibilidades);
        }),
        catchError(error => {
          console.error('Error loading disponibilidades:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchDisponibilidades(searchTerm: string) {
    this.isLoading = true;

    return this.disponibilidadService.getDisponibilidadesPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((disponibilidad: any) => {
            const nombre = (disponibilidad.nombre || '').toLowerCase();
            const descripcion = (disponibilidad.descripcion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return nombre.includes(searchLower) || descripcion.includes(searchLower);
          });

          let disponibilidades = this.mapDisponibilidadesToOptions(filteredList);

          // Filter only active if required
          if (this.showOnlyActive) {
            disponibilidades = disponibilidades.filter(d => d.activo);
          }

          this.isLoading = false;
          return of(disponibilidades);
        }),
        catchError(error => {
          console.error('Error searching disponibilidades:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapDisponibilidadesToOptions(disponibilidades: any[]): DisponibilidadOption[] {
    return disponibilidades.map(d => ({
      id: d.id,
      nombre: d.nombre || '',
      descripcion: d.descripcion || '',
      activo: d.activo !== false,
      displayText: this.buildDisplayText(d)
    }));
  }

  private buildDisplayText(disponibilidad: any): string {
    const nombre = disponibilidad.nombre;
    const descripcion = disponibilidad.descripcion;

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
    this.loadInitialData().subscribe(disponibilidades => {
      this.disponibilidades = disponibilidades;
    });

    // Clear search when opening if no selection
    if (!this.selectedDisponibilidad) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(disponibilidad: DisponibilidadOption): void {
    this.selectDisponibilidad(disponibilidad);
    this.closeDropdown();
  }

  private selectDisponibilidad(disponibilidad: DisponibilidadOption | null): void {
    this.selectedDisponibilidad = disponibilidad;
    this.selectedControl.setValue(disponibilidad);

    if (disponibilidad) {
      this.onChange(disponibilidad.id);
    } else {
      this.onChange(null);
    }

    this.disponibilidadSelected.emit(disponibilidad);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectDisponibilidad(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialDisponibilidades();
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
    if (this.selectedDisponibilidad) {
      this.placeholder = this.selectedDisponibilidad.displayText;
    } else {
      this.placeholder = 'Seleccionar disponibilidad...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findDisponibilidadById(value);
    } else if (value && typeof value === 'object') {
      this.selectDisponibilidad(value);
    } else {
      this.selectDisponibilidad(null);
    }
  }

  private findDisponibilidadById(id: number): void {
    // First check if it's in current list
    const found = this.disponibilidades.find(d => d.id === id);
    if (found) {
      this.selectDisponibilidad(found);
      return;
    }

    // If not found, make a specific request
    this.disponibilidadService.getDisponibilidadById(id).subscribe({
      next: (response) => {
        const disponibilidadData = response.data || response;
        if (disponibilidadData) {
          const disponibilidad = this.mapDisponibilidadesToOptions([disponibilidadData])[0];
          this.selectDisponibilidad(disponibilidad);
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

  trackByDisponibilidad(index: number, disponibilidad: DisponibilidadOption): number {
    return disponibilidad.id;
  }
}
