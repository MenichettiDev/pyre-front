import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-modal.component.html',
  styleUrls: ['./toast-modal.component.css']
})
export class ToastModalComponent {
  @Input() message: string = '';
  @Input() isVisible: boolean = false;
  @Input() type: string = 'success';
}