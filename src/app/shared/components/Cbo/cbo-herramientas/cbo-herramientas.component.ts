import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { HerramientaService } from '../../../../services/herramienta.service';

export interface HerramientaOption {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  disponibilidad: string;
  displayText: string;
}

@Component({
  selector: 'app-cbo-herramientas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-herramientas.component.html',
  styleUrls: ['./cbo-herramientas.component.css', '../cbo.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboHerramientasComponent),
      multi: true
    }
  ]
})
export class CboHerramientasComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<HerramientaOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar herramienta...';
  @Input() showOnlyAvailable: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() herramientaSelected = new EventEmitter<HerramientaOption | null>();

  // Component state
  herramientas: HerramientaOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedHerramienta: HerramientaOption | null = null;

  constructor(private herramientaService: HerramientaService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialHerramientas();
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

          if (searchTerm.length >= 3) {
            return this.searchHerramientas(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(herramientas => {
        this.herramientas = herramientas;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialHerramientas(): void {
    this.loadInitialData().subscribe(herramientas => {
      this.herramientas = herramientas;
    });
  }

  private loadInitialData() {
    this.isLoading = true;
    return this.herramientaService.getTools(1, 10, '')
      .pipe(
        switchMap(response => {
          const rawList = response.data || [];
          let filteredList = rawList;

          if (this.showOnlyAvailable) {
            filteredList = rawList.filter(h =>
              h.disponibilidad === 'Disponible' || h.estadoDisponibilidad === 'Disponible'
            );
          }

          const herramientas = this.mapHerramientasToOptions(filteredList);
          this.isLoading = false;
          return of(herramientas);
        }),
        catchError(error => {
          console.error('Error loading herramientas:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchHerramientas(searchTerm: string) {
    this.isLoading = true;
    return this.herramientaService.getTools(1, 20, searchTerm)
      .pipe(
        switchMap(response => {
          const rawList = response.data || [];
          let filteredList = rawList;

          if (this.showOnlyAvailable) {
            filteredList = rawList.filter(h =>
              h.disponibilidad === 'Disponible' || h.estadoDisponibilidad === 'Disponible'
            );
          }

          const herramientas = this.mapHerramientasToOptions(filteredList);
          this.isLoading = false;
          return of(herramientas);
        }),
        catchError(error => {
          console.error('Error searching herramientas:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapHerramientasToOptions(herramientas: any[]): HerramientaOption[] {
    return herramientas.map(h => ({
      id: h.id || h.idHerramienta,
      codigo: h.codigo || '',
      nombre: h.nombre || h.nombreHerramienta || '',
      marca: h.marca || '',
      disponibilidad: h.disponibilidad || h.estadoDisponibilidad || '',
      displayText: this.buildDisplayText(h)
    }));
  }

  private buildDisplayText(herramienta: any): string {
    const codigo = herramienta.codigo || herramienta.id;
    const nombre = herramienta.nombre || herramienta.nombreHerramienta;
    const marca = herramienta.marca ? ` - ${herramienta.marca}` : '';
    return `${codigo} - ${nombre}${marca}`;
  }

  // New methods for handling input interactions
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
    this.loadInitialData().subscribe(herramientas => {
      this.herramientas = herramientas;
    });

    // Clear search when opening if no selection
    if (!this.selectedHerramienta) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(herramienta: HerramientaOption): void {
    this.selectHerramienta(herramienta);
    this.closeDropdown();
  }

  private selectHerramienta(herramienta: HerramientaOption | null): void {
    this.selectedHerramienta = herramienta;
    this.selectedControl.setValue(herramienta);

    if (herramienta) {
      this.onChange(herramienta.id);
    } else {
      this.onChange(null);
    }

    this.herramientaSelected.emit(herramienta);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectHerramienta(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialHerramientas();
  }

  private updatePlaceholderText(): void {
    if (this.selectedHerramienta) {
      this.placeholder = this.selectedHerramienta.displayText;
    } else {
      this.placeholder = 'Seleccionar herramienta...';
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
    if (value && typeof value === 'number') {
      this.findHerramientaById(value);
    } else if (value && typeof value === 'object') {
      this.selectHerramienta(value);
    } else {
      this.selectHerramienta(null);
    }
  }

  private findHerramientaById(id: number): void {
    // First check if it's in current list
    const found = this.herramientas.find(h => h.id === id);
    if (found) {
      this.selectHerramienta(found);
      return;
    }

    // If not found, make a specific request (optional)
    // You might want to implement getToolById in your service
    // For now, just set the ID
    this.onChange(id);
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

  trackByHerramienta(index: number, herramienta: HerramientaOption): number {
    return herramienta.id;
  }
}
