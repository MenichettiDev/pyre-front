import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';

/**
 * Simple reusable paginator component.
 * Inputs:
 * - length: total number of items
 * - pageSize: items per page
 * - pageIndex: current page (0-based)
 * - pageSizeOptions: array of allowed page sizes
 * Emits:
 * - pageChange: { pageIndex, pageSize }
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {
  @Input() length = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0; // zero-based
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  // temporary input model for page jump
  jumpPageInput: number | null = null;
  jumpInputInvalid = false;
  // aria message for page changes
  ariaPageMessage = '';

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.length / this.pageSize));
  }

  /**
   * Friendly display range helpers to use from template (avoid using global Math in template).
   */
  get displayStart(): number {
    if (this.length === 0) return 0;
    return this.pageIndex * this.pageSize + 1;
  }

  get displayEnd(): number {
    return Math.min(this.length, (this.pageIndex + 1) * this.pageSize);
  }

  goTo(pageIndex: number) {
    const newIndex = Math.max(0, Math.min(pageIndex, this.totalPages - 1));
    if (newIndex !== this.pageIndex) {
      this.pageIndex = newIndex;
      this.emitChange();
    }
  }

  prev() {
    this.goTo(this.pageIndex - 1);
  }

  next() {
    this.goTo(this.pageIndex + 1);
  }

  onPageSizeChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.pageSize = value;
    // reset to first page when page size changes
    this.pageIndex = 0;
    this.emitChange();
  }

  private emitChange() {
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  // handle manual page jump (1-based input)
  onJumpPage(event: Event) {
    if (this.length === 0) {
      this.jumpInputInvalid = false;
      return;
    }
    const vRaw = (event.target as HTMLInputElement).value;
    const v = +(vRaw);
    if (!Number.isFinite(v) || v <= 0) {
      this.jumpInputInvalid = true;
      return;
    }
    this.jumpInputInvalid = false;
    const newIndex = Math.max(0, Math.min(Math.floor(v) - 1, this.totalPages - 1));
    if (newIndex !== this.pageIndex) {
      this.pageIndex = newIndex;
      this.emitChange();
      this.ariaPageMessage = `Página ${this.pageIndex + 1} de ${this.totalPages}`;
    }
    // keep the input in sync
    this.jumpPageInput = newIndex + 1;
  }

  onJumpKeyEnter(event: KeyboardEvent) {
    // reuse the same logic but extract the input target
    const input = event.target as HTMLInputElement;
    const fakeEvent = { target: input } as unknown as Event;
    this.onJumpPage(fakeEvent);
  }
}
