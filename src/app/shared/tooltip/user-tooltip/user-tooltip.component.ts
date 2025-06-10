import { Component, Input } from '@angular/core';
import { User } from '../../../users/user/user.model';

@Component({
  selector: 'app-user-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './user-tooltip.component.html',
  styleUrl: './user-tooltip.component.css',
})
export class UserTooltipComponent {
  @Input() user!: User;
}
