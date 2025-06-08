import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class ImageStorageService {
  private readonly USERS_IMAGE_PREFIX = '/users/';
  private readonly STORAGE_KEY = 'user_images';

  saveImageToLocalStorage(userId: string, imageData: string): string {
    const filename = `user-${userId}-${Date.now()}.jpg`;
    const images = this.getStoredImages();
    images[filename] = imageData;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
    return this.USERS_IMAGE_PREFIX + filename;
  }

  getImageFromLocalStorage(filename: string): string | null {
    const images = this.getStoredImages();
    const shortFilename = filename.replace(this.USERS_IMAGE_PREFIX, '');
    return images[shortFilename] || null;
  }

  private getStoredImages(): { [key: string]: string } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }
}
