import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { FamiliaHerramientaService, FamiliaHerramientaDto } from '../../../../services/familia-herramienta.service';

export interface FamiliaHerramientaOption {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-familia-herramienta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-familia-herramienta.component.html',
  styleUrls: ['./cbo-familia-herramienta.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboFamiliaHerramientaComponent),
      multi: true
    }
  ]
})
export class CboFamiliaHerramientaComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<FamiliaHerramientaOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar familia...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() familiaSelected = new EventEmitter<FamiliaHerramientaOption | null>();

  // Component state
  familias: FamiliaHerramientaOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedFamilia: FamiliaHerramientaOption | null = null;

  constructor(private familiaService: FamiliaHerramientaService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialFamilias();
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
            return this.searchFamilias(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(familias => {
        this.familias = familias;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialFamilias(): void {
    this.loadInitialData().subscribe(familias => {
      this.familias = familias;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.familiaService.getFamiliasPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          let familias = this.mapFamiliasToOptions(rawList);

          // Filter only active if required
          if (this.showOnlyActive) {
            familias = familias.filter(f => f.activo);
          }

          this.isLoading = false;
          return of(familias);
        }),
        catchError(error => {
          console.error('Error loading familias:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchFamilias(searchTerm: string) {
    this.isLoading = true;

    return this.familiaService.getFamiliasPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((familia: any) => {
            const codigo = (familia.codigo || '').toLowerCase();
            const nombre = (familia.nombre || '').toLowerCase();
            const descripcion = (familia.descripcion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return codigo.includes(searchLower) ||
              nombre.includes(searchLower) ||
              descripcion.includes(searchLower);
          });

          let familias = this.mapFamiliasToOptions(filteredList);

          // Filter only active if required
          if (this.showOnlyActive) {
            familias = familias.filter(f => f.activo);
          }

          this.isLoading = false;
          return of(familias);
        }),
        catchError(error => {
          console.error('Error searching familias:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapFamiliasToOptions(familias: any[]): FamiliaHerramientaOption[] {
    return familias.map(f => ({
      id: f.id,
      codigo: f.codigo || '',
      nombre: f.nombre || '',
      descripcion: f.descripcion || '',
      activo: f.activo !== false,
      displayText: this.buildDisplayText(f)
    }));
  }

  private buildDisplayText(familia: any): string {
    const codigo = familia.codigo;
    const nombre = familia.nombre;
    const descripcion = familia.descripcion;

    let text = '';
    if (codigo) {
      text += `${codigo} - `;
    }
    text += nombre;
    if (descripcion && descripcion !== nombre) {
      text += ` (${descripcion})`;
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
    this.loadInitialData().subscribe(familias => {
      this.familias = familias;
    });

    // Clear search when opening if no selection
    if (!this.selectedFamilia) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(familia: FamiliaHerramientaOption): void {
    this.selectFamilia(familia);
    this.closeDropdown();
  }

  private selectFamilia(familia: FamiliaHerramientaOption | null): void {
    this.selectedFamilia = familia;
    this.selectedControl.setValue(familia);

    if (familia) {
      this.onChange(familia.id);
    } else {
      this.onChange(null);
    }

    this.familiaSelected.emit(familia);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectFamilia(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialFamilias();
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
    if (this.selectedFamilia) {
      this.placeholder = this.selectedFamilia.displayText;
    } else {
      this.placeholder = 'Seleccionar familia...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findFamiliaById(value);
    } else if (value && typeof value === 'object') {
      this.selectFamilia(value);
    } else {
      this.selectFamilia(null);
    }
  }

  private findFamiliaById(id: number): void {
    // First check if it's in current list
    const found = this.familias.find(f => f.id === id);
    if (found) {
      this.selectFamilia(found);
      return;
    }

    // If not found, make a specific request
    this.familiaService.getFamiliaById(id).subscribe({
      next: (response) => {
        const familiaData = response.data || response;
        if (familiaData) {
          const familia = this.mapFamiliasToOptions([familiaData])[0];
          this.selectFamilia(familia);
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

  trackByFamilia(index: number, familia: FamiliaHerramientaOption): number {
    return familia.id;
  }
}
