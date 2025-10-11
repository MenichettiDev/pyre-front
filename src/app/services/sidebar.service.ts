import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _visible$ = new BehaviorSubject<boolean>(true);

  /** Observable público para suscribirse al estado del sidebar */
  get visible$(): Observable<boolean> {
    return this._visible$.asObservable();
  }

  /** Valor sincrónico (poco usado) */
  get isVisible(): boolean {
    return this._visible$.getValue();
  }

  show(): void {
    this._visible$.next(true);
  }

  hide(): void {
    this._visible$.next(false);
  }

  toggle(): void {
    this._visible$.next(!this._visible$.getValue());
  }
}
