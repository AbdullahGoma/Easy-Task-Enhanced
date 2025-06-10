import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private overlayRef: OverlayRef | null = null;

  constructor(private overlay: Overlay) {}

  show<T extends object>(
    component: any,
    event: MouseEvent,
    data?: Partial<T>
  ): void {
    this.hide();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const portal = new ComponentPortal(component);
    const componentRef = this.overlayRef.attach(portal);

    if (data) {
      Object.assign(componentRef.instance as T, data);
    }
  }

  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
