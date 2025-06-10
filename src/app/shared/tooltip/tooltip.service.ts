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

    const hostElement = event.currentTarget as HTMLElement;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(hostElement)
      .withPositions([
        // Primary position - right of the element
        {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 8,
        },
        // Fallback position - left of the element
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
        },
        // Mobile fallback - bottom of the element
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
        },
      ])
      .withFlexibleDimensions(true)
      .withPush(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
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
