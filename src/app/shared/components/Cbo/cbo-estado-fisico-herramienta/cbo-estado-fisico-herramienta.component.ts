import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subject } from 'rxjs';
import { EstadoFisicoHerramientaService } from '../../../../services/estado-fisico-herramienta.service';

@Component({
  selector: 'app-cbo-estado-fisico-herramienta',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  @Input() isLabel: string = '';
  @Input() isId: string = 'estado-fisico-select';
  @Input() isDisabled: boolean = false;
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;

  @Output() estadoFisicoSelected = new EventEmitter<any>();

  // Internal state
  estadosFisicos: any[] = [];
  selectedEstadoFisico: any = null;
  searchControl = new FormControl('');
  isOpen = false;
  isLoading = false;
  placeholder = 'Seleccionar estado físico...';

  private destroy$ = new Subject<void>();
  private onChange = (value: any) => { };
  private onTouched = () => { };

  constructor(private estadoFisicoService: EstadoFisicoHerramientaService) { }

  ngOnInit(): void {
    this.setupSearch();
    this.loadEstadosFisicos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && value !== this.selectedEstadoFisico) {
      this.selectedEstadoFisico = value;
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
          return of(this.estadosFisicos);
        }
        this.isLoading = true;
        return this.searchEstadosFisicos(searchTerm);
      })
    ).subscribe((estadosFisicos: any) => {
      if (!this.searchControl.value || this.searchControl.value.length < 2) {
        // Don't update if it's just the initial load
      } else {
        this.estadosFisicos = estadosFisicos || [];
      }
      this.isLoading = false;
    });
  }

  private searchEstadosFisicos(searchTerm: string) {
    return this.estadoFisicoService.getEstadosFisicos().pipe(
      switchMap(response => {
        const rawList = response.data || [];

        // Filter client-side by search term
        const filteredList = rawList.filter((estadoFisico: any) => {
          const descripcion = (estadoFisico.descripcionEstado || '').toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return descripcion.includes(searchLower);
        });

        return of(filteredList);
      }),
      catchError(error => {
        console.error('Error searching estados físicos:', error);
        return of([]);
      })
    );
  }

  private loadEstadosFisicos(): void {
    this.isLoading = true;
    this.estadoFisicoService.getEstadosFisicos().pipe(
      catchError(error => {
        console.error('Error loading estados físicos:', error);
        return of({ data: [] });
      })
    ).subscribe((response: any) => {
      this.estadosFisicos = response.data || [];
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
      this.loadEstadosFisicos();
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
      this.loadEstadosFisicos();
    } else {
      this.updatePlaceholder();
    }
  }

  onOptionClick(estadoFisico: any): void {
    this.selectedEstadoFisico = estadoFisico;
    this.isOpen = false;
    this.updatePlaceholder();

    // Emit events
    this.estadoFisicoSelected.emit(estadoFisico);
    this.onChange(estadoFisico);
    this.onTouched();
  }

  clearSelection(): void {
    this.selectedEstadoFisico = null;
    this.searchControl.setValue('');
    this.updatePlaceholder();

    // Emit events
    this.estadoFisicoSelected.emit(null);
    this.onChange(null);
    this.onTouched();
  }

  private updatePlaceholder(): void {
    if (this.selectedEstadoFisico) {
      this.placeholder = this.selectedEstadoFisico.descripcionEstado || 'Estado físico seleccionado';
    } else {
      this.placeholder = 'Seleccionar estado físico...';
    }
  }

  trackByEstadoFisico(index: number, estadoFisico: any): any {
    return estadoFisico.idEstadoFisico || index;
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
