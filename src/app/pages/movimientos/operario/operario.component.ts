import { Component, OnInit } from '@angular/core';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-operario',
  imports: [],
  templateUrl: './operario.component.html',
  styleUrl: './operario.component.css'
})
export class OperarioComponent implements OnInit {

  constructor(private pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.pageTitleService.setTitle('Movimientos por Operario');
  }

}
