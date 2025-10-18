import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { RolUsuarioService, RolDto } from '../../../../services/rol-usuario.service';

export interface RolUsuarioOption {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  displayText: string;
}

@Component({
  selector: 'app-cbo-rol-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cbo-rol-usuario.component.html',
  styleUrls: ['./cbo-rol-usuario.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CboRolUsuarioComponent),
      multi: true
    }
  ]
})
export class CboRolUsuarioComponent implements OnInit, OnDestroy, ControlValueAccessor {

  // Internal FormControl for search
  searchControl = new FormControl('');
  selectedControl = new FormControl<RolUsuarioOption | null>(null);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // ControlValueAccessor callbacks
  private onChange = (value: any) => { };
  private onTouched = () => { };

  // Component inputs
  @Input() isLabel: string = '';
  @Input() isId: string = '';
  @Input() isDisabled: boolean = false;
  @Input() placeholder: string = 'Seleccionar rol...';
  @Input() showOnlyActive: boolean = true;
  @Input() objectErrors: any = null;
  @Input() isTouched: boolean = false;

  // Output events
  @Output() isEmiterTouched = new EventEmitter<boolean>();
  @Output() rolSelected = new EventEmitter<RolUsuarioOption | null>();

  // Component state
  roles: RolUsuarioOption[] = [];
  isLoading = false;
  isOpen = false; // Start collapsed
  selectedRol: RolUsuarioOption | null = null;

  constructor(private rolService: RolUsuarioService) { }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialRoles();
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
            return this.searchRoles(searchTerm);
          } else if (searchTerm.length === 0) {
            return this.loadInitialData();
          } else {
            return of([]);
          }
        })
      )
      .subscribe(roles => {
        this.roles = roles;
      });

    this.subscriptions.push(searchSub);
  }

  private loadInitialRoles(): void {
    this.loadInitialData().subscribe(roles => {
      this.roles = roles;
    });
  }

  private loadInitialData() {
    this.isLoading = true;

    return this.rolService.getRolesPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];
          let roles = this.mapRolesToOptions(rawList);

          // Filter only active if required
          if (this.showOnlyActive) {
            roles = roles.filter(r => r.activo);
          }

          this.isLoading = false;
          return of(roles);
        }),
        catchError(error => {
          console.error('Error loading roles:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private searchRoles(searchTerm: string) {
    this.isLoading = true;

    return this.rolService.getRolesPaged(1, 20)
      .pipe(
        switchMap(response => {
          const rawList = response.data?.data || response.data || [];

          // Filter client-side by search term
          const filteredList = rawList.filter((rol: any) => {
            const codigo = (rol.codigo || '').toLowerCase();
            const nombre = (rol.nombre || '').toLowerCase();
            const descripcion = (rol.descripcion || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            return codigo.includes(searchLower) ||
              nombre.includes(searchLower) ||
              descripcion.includes(searchLower);
          });

          let roles = this.mapRolesToOptions(filteredList);

          // Filter only active if required
          if (this.showOnlyActive) {
            roles = roles.filter(r => r.activo);
          }

          this.isLoading = false;
          return of(roles);
        }),
        catchError(error => {
          console.error('Error searching roles:', error);
          this.isLoading = false;
          return of([]);
        })
      );
  }

  private mapRolesToOptions(roles: any[]): RolUsuarioOption[] {
    return roles.map(r => ({
      id: r.id,
      codigo: r.codigo || '',
      nombre: r.nombre || '',
      descripcion: r.descripcion || '',
      activo: r.activo !== false,
      displayText: this.buildDisplayText(r)
    }));
  }

  private buildDisplayText(rol: any): string {
    const codigo = rol.codigo;
    const nombre = rol.nombre;
    const descripcion = rol.descripcion;

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
    this.loadInitialData().subscribe(roles => {
      this.roles = roles;
    });

    // Clear search when opening if no selection
    if (!this.selectedRol) {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.updatePlaceholderText();
  }

  onOptionClick(rol: RolUsuarioOption): void {
    this.selectRol(rol);
    this.closeDropdown();
  }

  private selectRol(rol: RolUsuarioOption | null): void {
    this.selectedRol = rol;
    this.selectedControl.setValue(rol);

    if (rol) {
      this.onChange(rol.id);
    } else {
      this.onChange(null);
    }

    this.rolSelected.emit(rol);
    this.updatePlaceholderText();
  }

  clearSelection(): void {
    this.selectRol(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadInitialRoles();
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
    if (this.selectedRol) {
      this.placeholder = this.selectedRol.displayText;
    } else {
      this.placeholder = 'Seleccionar rol...';
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'number') {
      this.findRolById(value);
    } else if (value && typeof value === 'object') {
      this.selectRol(value);
    } else {
      this.selectRol(null);
    }
  }

  private findRolById(id: number): void {
    // First check if it's in current list
    const found = this.roles.find(r => r.id === id);
    if (found) {
      this.selectRol(found);
      return;
    }

    // If not found, make a specific request
    this.rolService.getRolById(id).subscribe({
      next: (response) => {
        const rolData = response.data || response;
        if (rolData) {
          const rol = this.mapRolesToOptions([rolData])[0];
          this.selectRol(rol);
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

  trackByRol(index: number, rol: RolUsuarioOption): number {
    return rol.id;
  }
}
