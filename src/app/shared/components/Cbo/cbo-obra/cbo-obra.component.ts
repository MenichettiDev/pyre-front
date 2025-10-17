import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { ObrasService } from '../../../../services/obras.service';

export interface ObraOption {
  idObra: number;
  codigo: string;
  nombreObra: string;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  displayText: string;
}

@Component({
  selector: 'app-cbo-obra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-obra.component.html',
  styleUrls: ['./cbo-obra.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboObraComponent),
      multi: true
    }
  ]
})
export class CboObraComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<ObraOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar obra...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() obraSelected = new EventEmitter<ObraOption | null>();

  // Component state
  obras: ObraOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedObra: ObraOption | null = null;

  constructor(private obrasService: ObrasService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialObras();
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
            return this.searchObras(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(obras => {
        this.obras = obras;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialObras(): void {
    this.loadInitialData().subscribe(obras => {
      this.obras = obras;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.obrasService.getObrasPaged(1, 10)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          const obras = this.mapObrasToOptions(rawList);
          this.isLoading = false;
          return of(obras);
        }),
        catchError(error => {
          console.error('Error loading obras:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchObras(searchTerm: string) {
    this.isLoading = true;

    // For obras, we'll search by name or code
    return this.obrasService.getObrasPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((obra: any) => {
            const codigo = (obra.codigo || '').toLowerCase();
            const nombre = (obra.nombreObra || '').toLowerCase();
            const ubicacion = (obra.ubicacion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return codigo.includes(searchLower) ||
              nombre.includes(searchLower) ||
              ubicacion.includes(searchLower);
          });

          const obras = this.mapObrasToOptions(filteredList);
          this.isLoading = false;
          return of(obras);
        }),
        catchError(error => {
          console.error('Error searching obras:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapObrasToOptions(obras: any[]): ObraOption[] {
    return obras.map(o => ({
      idObra: o.idObra || o.id,
      codigo: o.codigo || '',
      nombreObra: o.nombreObra || o.nombre || '',
      ubicacion: o.ubicacion || '',
      fechaInicio: o.fechaInicio || '',
      fechaFin: o.fechaFin || '',
      displayText: this.buildDisplayText(o)
    }));
  }

  private buildDisplayText(obra: any): string {
    const codigo = obra.codigo;
    const nombre = obra.nombreObra || obra.nombre;
    const ubicacion = obra.ubicacion;

    let text = '';
    if (codigo) {
      text += `${codigo} - `;
    }
    text += nombre;
    if (ubicacion) {
      text += ` (${ubicacion})`;
    }
    return text;
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
    this.loadInitialData().subscribe(obras => {
      this.obras = obras;
    });

    // Clear search when opening if no selection
    if (!this.selectedObra) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(obra: ObraOption): void {
    this.selectObra(obra);
    this.closeDropdown();
  }

  private selectObra(obra: ObraOption | null): void {
    this.selectedObra = obra;
    this.selectedControl.setValue(obra);

    if (obra) {
      this.onChange(obra.idObra);
    } else {
      this.onChange(null);
    }

    this.obraSelected.emit(obra);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectObra(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialObras();
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
    if (this.selectedObra) {
      this.placeholder = this.selectedObra.displayText;
    } else {
      this.placeholder = 'Seleccionar obra...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findObraById(value);
    } else if (value && typeof value === 'object') {
      this.selectObra(value);
    } else {
      this.selectObra(null);
    }
  }

  private findObraById(id: number): void {
    // First check if it's in current list
    const found = this.obras.find(o => o.idObra === id);
    if (found) {
      this.selectObra(found);
      return;
    }

    // If not found, make a specific request
    this.obrasService.getObraById(id).subscribe({
      next: (response) => {
        const obraData = response.data || response;
        if (obraData) {
          const obra = this.mapObrasToOptions([obraData])[0];
          this.selectObra(obra);
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

  trackByObra(index: number, obra: ObraOption): number {
    return obra.idObra;
  }
}
