import { Directive, Input, HostListener, Type } from '@angular/core';
import { TooltipService } from './tooltip.service';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input() appTooltip!: Type<any>; // Just accept a component type
  @Input() tooltipData: any;

  constructor(private tooltipService: TooltipService) {}

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent): void {
    this.tooltipService.show(this.appTooltip, event, this.tooltipData);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.tooltipService.hide();
  }
}
