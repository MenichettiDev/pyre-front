import { Component, EventEmitter, Input, OnInit, Output, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Roles } from '../../../shared/enums/roles';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() userData: any | null = null;
  @Output() close = new EventEmitter<void>();

  visible = true;
  rolesList: Array<{ id: number; label: string }> = [];
  @ViewChild('firstFocusable') firstFocusable!: ElementRef;

  ngOnInit(): void {
    this.initRoles();
    try {
      document.body.classList.add('no-scroll');
    } catch (e) {
      // ignore when server-side or document undefined
    }
  }

  ngAfterViewInit(): void {
    // focus al primer elemento interactivo si existe
    try {
      const el = this.firstFocusable?.nativeElement as HTMLElement | undefined;
      if (el) {
        setTimeout(() => el.focus(), 120);
      }
    } catch (e) {
      // ignore
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.onClose();
  }

  private initRoles() {
    this.rolesList = Object.keys(Roles)
      .filter(key => isNaN(Number(key)))
      .map(name => ({ id: (Roles as any)[name] as number, label: name }));
  }

  getRoleName(roleId: number): string {
    if (!roleId) return 'Sin rol';
    const role = this.rolesList.find(r => r.id === roleId);
    return role?.label || `Rol ${roleId}`;
  }

  getDisplayValue(value: any, fallback: string = 'No disponible'): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return String(value);
  }

  onClose(): void {
    this.close.emit();
    this.visible = false;
    try {
      document.body.classList.remove('no-scroll');
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    try {
      document.body.classList.remove('no-scroll');
    } catch (e) {
      // ignore
    }
  }
}
