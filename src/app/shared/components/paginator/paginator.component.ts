import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

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
  imports: [CommonModule, NgFor, NgbTooltipModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {
  @Input() length = 0;
  // fixed page size across app (rows per page)
  @Input() pageSize = 6;
  @Input() pageIndex = 0; // zero-based

  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  // temporary input model for page jump
  jumpPageInput: number | null = null;
  // aria message for page changes
  ariaPageMessage = '';
  // maximum number of page buttons to show in the center (odd number recommended)
  maxPageButtons = 5;

  /**
   * Compute the array of page numbers to render as buttons (1-based).
   * Centers around current page when possible.
   */
  get pageButtons(): number[] {
    const total = this.totalPages;
    const maxButtons = Math.max(1, Math.min(this.maxPageButtons, total));
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, this.pageIndex + 1 - half);
    let end = start + maxButtons - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxButtons + 1);
    }
    const res: number[] = [];
    for (let i = start; i <= end; i++) res.push(i);
    return res;
  }

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

  // page size is fixed; no runtime change handler

  private emitChange() {
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  // handle manual page jump (1-based input)
  onJumpPage(event: Event) {
    if (this.length === 0) {
      return;
    }
    const vRaw = (event.target as HTMLInputElement).value;
    const v = +(vRaw);
    // if invalid input, ignore silently (do not set an error flag)
    if (!Number.isFinite(v) || v <= 0) {
      return;
    }
    const newIndex = Math.max(0, Math.min(Math.floor(v) - 1, this.totalPages - 1));
    // If the requested page is beyond bounds, normalize it to last page.
    const requested = Math.floor(v);
    const normalized = Math.max(1, Math.min(requested, this.totalPages));
    const normalizedIndex = normalized - 1;
    // update pageIndex and emit change only if different
    if (normalizedIndex !== this.pageIndex) {
      this.pageIndex = normalizedIndex;
      this.emitChange();
    }
    // keep the input in sync and always update aria message to reflect normalized page
    this.jumpPageInput = normalizedIndex + 1;
    this.ariaPageMessage = `Página ${normalizedIndex + 1} de ${this.totalPages}`;
  }

  onJumpKeyEnter(event: KeyboardEvent) {
    // reuse the same logic but extract the input target
    const input = event.target as HTMLInputElement;
    const fakeEvent = { target: input } as unknown as Event;
    this.onJumpPage(fakeEvent);
  }
}
