// tooltip.directive.ts
import { Directive, Input, HostListener } from '@angular/core';
import { TooltipType } from './tooltip-types';
import { TooltipComponent } from './tooltip.component';
import { UserTooltipComponent } from './user-tooltip/user-tooltip.component';
import { TaskTooltipComponent } from './task-tooltip/task-tooltip.component';
import { TooltipService } from './tooltip.service';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input() appTooltip: TooltipType = TooltipType.CUSTOM;
  @Input() tooltipData: any;

  constructor(private tooltipService: TooltipService) {}

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent): void {
    switch (this.appTooltip) {
      case TooltipType.USER:
        this.tooltipService.show(UserTooltipComponent, event, {
          user: this.tooltipData,
        });
        break;
      case TooltipType.TASK:
        this.tooltipService.show(TaskTooltipComponent, event, {
          task: this.tooltipData,
        });
        break;
      case TooltipType.CUSTOM:
        this.tooltipService.show(TooltipComponent, event);
        break;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.tooltipService.hide();
  }
}
