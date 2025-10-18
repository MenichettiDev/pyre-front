import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { EstadoFisicoHerramientaService, EstadoFisicoDto } from '../../../../services/estado-fisico-herramienta.service';

export interface EstadoFisicoOption {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-estado-fisico-herramienta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-estado-fisico-herramienta.component.html',
  styleUrls: ['./cbo-estado-fisico-herramienta.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboEstadoFisicoHerramientaComponent),
      multi: true
    }
  ]
})
export class CboEstadoFisicoHerramientaComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<EstadoFisicoOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar estado físico...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() estadoFisicoSelected = new EventEmitter<EstadoFisicoOption | null>();

  // Component state
  estadosFisicos: EstadoFisicoOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedEstadoFisico: EstadoFisicoOption | null = null;

  constructor(private estadoFisicoService: EstadoFisicoHerramientaService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialEstadosFisicos();
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
            return this.searchEstadosFisicos(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(estadosFisicos => {
        this.estadosFisicos = estadosFisicos;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialEstadosFisicos(): void {
    this.loadInitialData().subscribe(estadosFisicos => {
      this.estadosFisicos = estadosFisicos;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.estadoFisicoService.getEstadosFisicosPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          let estadosFisicos = this.mapEstadosFisicosToOptions(rawList);

          // Filter only active if required
          if (this.showOnlyActive) {
            estadosFisicos = estadosFisicos.filter(e => e.activo);
          }

          this.isLoading = false;
          return of(estadosFisicos);
        }),
        catchError(error => {
          console.error('Error loading estados físicos:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchEstadosFisicos(searchTerm: string) {
    this.isLoading = true;

    return this.estadoFisicoService.getEstadosFisicosPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((estado: any) => {
            const nombre = (estado.nombre || '').toLowerCase();
            const descripcion = (estado.descripcion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return nombre.includes(searchLower) || descripcion.includes(searchLower);
          });

          let estadosFisicos = this.mapEstadosFisicosToOptions(filteredList);

          // Filter only active if required
          if (this.showOnlyActive) {
            estadosFisicos = estadosFisicos.filter(e => e.activo);
          }

          this.isLoading = false;
          return of(estadosFisicos);
        }),
        catchError(error => {
          console.error('Error searching estados físicos:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapEstadosFisicosToOptions(estadosFisicos: any[]): EstadoFisicoOption[] {
    return estadosFisicos.map(e => ({
      id: e.id,
      nombre: e.nombre || '',
      descripcion: e.descripcion || '',
      activo: e.activo !== false,
      displayText: this.buildDisplayText(e)
    }));
  }

  private buildDisplayText(estadoFisico: any): string {
    const nombre = estadoFisico.nombre;
    const descripcion = estadoFisico.descripcion;

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
    this.loadInitialData().subscribe(estadosFisicos => {
      this.estadosFisicos = estadosFisicos;
    });

    // Clear search when opening if no selection
    if (!this.selectedEstadoFisico) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(estadoFisico: EstadoFisicoOption): void {
    this.selectEstadoFisico(estadoFisico);
    this.closeDropdown();
  }

  private selectEstadoFisico(estadoFisico: EstadoFisicoOption | null): void {
    this.selectedEstadoFisico = estadoFisico;
    this.selectedControl.setValue(estadoFisico);

    if (estadoFisico) {
      this.onChange(estadoFisico.id);
    } else {
      this.onChange(null);
    }

    this.estadoFisicoSelected.emit(estadoFisico);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectEstadoFisico(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialEstadosFisicos();
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
    if (this.selectedEstadoFisico) {
      this.placeholder = this.selectedEstadoFisico.displayText;
    } else {
      this.placeholder = 'Seleccionar estado físico...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findEstadoFisicoById(value);
    } else if (value && typeof value === 'object') {
      this.selectEstadoFisico(value);
    } else {
      this.selectEstadoFisico(null);
    }
  }

  private findEstadoFisicoById(id: number): void {
    // First check if it's in current list
    const found = this.estadosFisicos.find(e => e.id === id);
    if (found) {
      this.selectEstadoFisico(found);
      return;
    }

    // If not found, make a specific request
    this.estadoFisicoService.getEstadoFisicoById(id).subscribe({
      next: (response) => {
        const estadoFisicoData = response.data || response;
        if (estadoFisicoData) {
          const estadoFisico = this.mapEstadosFisicosToOptions([estadoFisicoData])[0];
          this.selectEstadoFisico(estadoFisico);
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

  trackByEstadoFisico(index: number, estadoFisico: EstadoFisicoOption): number {
    return estadoFisico.id;
  }
}
