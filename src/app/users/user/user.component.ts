import { Component, computed, input } from '@angular/core';

import { type User } from './user.model';
import { ImageStorageService } from '../../image-storage.service';

@Component({
  selector: 'app-user',
  standalone: true,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent {
  user = input.required<User>();

  constructor(private imageHelper: ImageStorageService) {}

  // For existing server images
  get imagePath(): string {
    return 'users/' + this.user().avatar;
  }

  // For uploaded images previewed from localStorage
  getSafeAvatar(): string {
    const avatar = this.user().avatar;

    // If avatar was just uploaded and stored locally
    if (avatar.startsWith('/users/')) {
      const storedImage = this.imageHelper.getImageFromLocalStorage(avatar);
      return storedImage || avatar;
    }

    // If it's a regular path (e.g., 'avatar.jpg'), return full image path
    return this.imagePath;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/users/default-avatar.jpg';
  }
}
