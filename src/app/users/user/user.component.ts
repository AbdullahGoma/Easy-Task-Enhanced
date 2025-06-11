import { Component, input } from '@angular/core';
import { type User } from './user.model';
import { ImageStorageService } from '../../image-storage.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
// import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';
// import { UserTooltipComponent } from '../../shared/tooltip/user-tooltip/user-tooltip.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
    // TooltipDirective
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent {
  user = input.required<User>();

  // readonly userTooltipComponent = UserTooltipComponent;

  constructor(private imageHelper: ImageStorageService) {}

  get imagePath(): string {
    return 'users/' + this.user().avatar;
  }

  getSafeAvatar(): string {
    const avatar = this.user().avatar;
    if (avatar.startsWith('/users/')) {
      const storedImage = this.imageHelper.getImageFromLocalStorage(avatar);
      return storedImage || avatar;
    }
    return this.imagePath;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/users/default-avatar.jpg';
  }
}
