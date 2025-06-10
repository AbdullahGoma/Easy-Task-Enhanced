import { Component, Input } from '@angular/core';
import { User } from '../../../users/user/user.model';
import { ImageStorageService } from '../../../image-storage.service';

@Component({
  selector: 'app-user-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './user-tooltip.component.html',
  styleUrl: './user-tooltip.component.css',
})
export class UserTooltipComponent {
  @Input() user!: User;

  constructor(private imageHelper: ImageStorageService) {}

  getSafeAvatar(): string {
    const avatar = this.user.avatar;
    if (avatar.startsWith('/users/')) {
      const storedImage = this.imageHelper.getImageFromLocalStorage(avatar);
      return storedImage || avatar;
    }
    return 'users/' + this.user.avatar;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/users/default-avatar.jpg';
  }
}
