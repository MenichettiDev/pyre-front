import { Component, EventEmitter, Input, Output, HostListener, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-details-proveedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-proveedores.component.html',
  styleUrls: ['./details-proveedores.component.css']
})
export class DetailsProveedoresComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() proveedorData: any | null = null;
  @Output() close = new EventEmitter<void>();

  visible = true;
  @ViewChild('firstFocusable') firstFocusable!: ElementRef;

  ngOnInit(): void {
    try {
      document.body.classList.add('no-scroll');
    } catch (e) { }
  }

  ngAfterViewInit(): void {
    try {
      const el = this.firstFocusable?.nativeElement as HTMLElement | undefined;
      if (el) {
        setTimeout(() => el.focus(), 120);
      }
    } catch (e) { }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.onClose();
  }

  getDisplayValue(value: any, fallback: string = 'No disponible'): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return String(value);
  }

  getActivoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  onClose(): void {
    this.close.emit();
    this.visible = false;
    try {
      document.body.classList.remove('no-scroll');
    } catch (e) { }
  }

  ngOnDestroy(): void {
    try {
      document.body.classList.remove('no-scroll');
    } catch (e) { }
  }
}
