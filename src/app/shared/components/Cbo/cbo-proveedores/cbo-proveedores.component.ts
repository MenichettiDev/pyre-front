import { Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription, switchMap, of, catchError } from 'rxjs';
import { ProveedoresService, ProveedorDto } from '../../../../services/proveedores.service';

export interface ProveedorOption {
    id: number;
    codigo: string;
    razonSocial: string;
    cuit: string;
    telefono: string;
    email: string;
    activo: boolean;
    displayText: string;
}

@Component({
    selector: 'app-cbo-proveedores',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './cbo-proveedores.component.html',
    styleUrls: ['./cbo-proveedores.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CboProveedoresComponent),
            multi: true
        }
    ]
})
export class CboProveedoresComponent implements OnInit, OnDestroy, ControlValueAccessor {

    // Internal FormControl for search
    searchControl = new FormControl('');
    selectedControl = new FormControl<ProveedorOption | null>(null);

    // Subscriptions for cleanup
    private subscriptions: Subscription[] = [];

    // ControlValueAccessor callbacks
    private onChange = (value: any) => { };
    private onTouched = () => { };

    // Component inputs
    @Input() isLabel: string = '';
    @Input() isId: string = '';
    @Input() isDisabled: boolean = false;
    @Input() placeholder: string = 'Seleccionar proveedor...';
    @Input() showOnlyActive: boolean = true;
    @Input() objectErrors: any = null;
    @Input() isTouched: boolean = false;

    // Output events
    @Output() isEmiterTouched = new EventEmitter<boolean>();
    @Output() proveedorSelected = new EventEmitter<ProveedorOption | null>();

    // Component state
    proveedores: ProveedorOption[] = [];
    isLoading = false;
    isOpen = false; // Start collapsed
    selectedProveedor: ProveedorOption | null = null;

    constructor(private proveedoresService: ProveedoresService) { }

    ngOnInit(): void {
        this.setupSearchSubscription();
        this.loadInitialProveedores();
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
                        return this.searchProveedores(searchTerm);
                    } else if (searchTerm.length === 0) {
                        return this.loadInitialData();
                    } else {
                        return of([]);
                    }
                })
            )
            .subscribe(proveedores => {
                this.proveedores = proveedores;
            });

        this.subscriptions.push(searchSub);
    }

    private loadInitialProveedores(): void {
        this.loadInitialData().subscribe(proveedores => {
            this.proveedores = proveedores;
        });
    }

    private loadInitialData() {
        this.isLoading = true;

        return this.proveedoresService.getProveedoresPaged(1, 20)
            .pipe(
                switchMap(response => {
                    const rawList = response.data?.data || response.data || [];
                    let proveedores = this.mapProveedoresToOptions(rawList);

                    // Filter only active if required
                    if (this.showOnlyActive) {
                        proveedores = proveedores.filter(p => p.activo);
                    }

                    this.isLoading = false;
                    return of(proveedores);
                }),
                catchError(error => {
                    console.error('Error loading proveedores:', error);
                    this.isLoading = false;
                    return of([]);
                })
            );
    }

    private searchProveedores(searchTerm: string) {
        this.isLoading = true;

        return this.proveedoresService.getProveedoresPaged(1, 20)
            .pipe(
                switchMap(response => {
                    const rawList = response.data?.data || response.data || [];

                    // Filter client-side by search term
                    const filteredList = rawList.filter((proveedor: any) => {
                        const codigo = (proveedor.codigo || '').toLowerCase();
                        const razonSocial = (proveedor.razonSocial || '').toLowerCase();
                        const cuit = (proveedor.cuit || '').toLowerCase();
                        const email = (proveedor.email || '').toLowerCase();
                        const searchLower = searchTerm.toLowerCase();

                        return codigo.includes(searchLower) ||
                            razonSocial.includes(searchLower) ||
                            cuit.includes(searchLower) ||
                            email.includes(searchLower);
                    });

                    let proveedores = this.mapProveedoresToOptions(filteredList);

                    // Filter only active if required
                    if (this.showOnlyActive) {
                        proveedores = proveedores.filter(p => p.activo);
                    }

                    this.isLoading = false;
                    return of(proveedores);
                }),
                catchError(error => {
                    console.error('Error searching proveedores:', error);
                    this.isLoading = false;
                    return of([]);
                })
            );
    }

    private mapProveedoresToOptions(proveedores: any[]): ProveedorOption[] {
        return proveedores.map(p => ({
            id: p.id,
            codigo: p.codigo || '',
            razonSocial: p.razonSocial || '',
            cuit: p.cuit || '',
            telefono: p.telefono || '',
            email: p.email || '',
            activo: p.activo !== false,
            displayText: this.buildDisplayText(p)
        }));
    }

    private buildDisplayText(proveedor: any): string {
        const codigo = proveedor.codigo;
        const razonSocial = proveedor.razonSocial;
        const cuit = proveedor.cuit;

        let text = '';
        if (codigo) {
            text += `${codigo} - `;
        }
        text += razonSocial;
        if (cuit) {
            text += ` (${cuit})`;
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
        this.loadInitialData().subscribe(proveedores => {
            this.proveedores = proveedores;
        });

        // Clear search when opening if no selection
        if (!this.selectedProveedor) {
            this.searchControl.setValue('', { emitEvent: false });
        }
    }

    private closeDropdown(): void {
        this.isOpen = false;
        this.updatePlaceholderText();
    }

    onOptionClick(proveedor: ProveedorOption): void {
        this.selectProveedor(proveedor);
        this.closeDropdown();
    }

    private selectProveedor(proveedor: ProveedorOption | null): void {
        this.selectedProveedor = proveedor;
        this.selectedControl.setValue(proveedor);

        if (proveedor) {
            this.onChange(proveedor.id);
        } else {
            this.onChange(null);
        }

        this.proveedorSelected.emit(proveedor);
        this.updatePlaceholderText();
    }

    clearSelection(): void {
        this.selectProveedor(null);
        this.searchControl.setValue('', { emitEvent: false });
        this.loadInitialProveedores();
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
        if (this.selectedProveedor) {
            this.placeholder = this.selectedProveedor.displayText;
        } else {
            this.placeholder = 'Seleccionar proveedor...';
        }
    }

    // ControlValueAccessor implementation
    writeValue(value: any): void {
        if (value && typeof value === 'number') {
            this.findProveedorById(value);
        } else if (value && typeof value === 'object') {
            this.selectProveedor(value);
        } else {
            this.selectProveedor(null);
        }
    }

    private findProveedorById(id: number): void {
        // First check if it's in current list
        const found = this.proveedores.find(p => p.id === id);
        if (found) {
            this.selectProveedor(found);
            return;
        }

        // If not found, make a specific request
        this.proveedoresService.getProveedorById(id).subscribe({
            next: (response) => {
                const proveedorData = response.data || response;
                if (proveedorData) {
                    const proveedor = this.mapProveedoresToOptions([proveedorData])[0];
                    this.selectProveedor(proveedor);
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

    trackByProveedor(index: number, proveedor: ProveedorOption): number {
        return proveedor.id;
    }
}
