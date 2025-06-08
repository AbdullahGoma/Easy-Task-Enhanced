import { inject, Injectable, signal } from '@angular/core';

import { DUMMY_USERS } from '../../dummy-users';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ImageStorageService } from '../image-storage.service';
import { User } from './user/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private users = signal<User[]>(DUMMY_USERS);
  private users$ = new BehaviorSubject<User[]>(DUMMY_USERS);
  private imageStorage = inject(ImageStorageService);

  get allUsers() {
    return this.users();
  }

  get usersObservable() {
    return this.users$.asObservable();
  }

  addUser(name: string, avatarData: string | null): Observable<User> {
    const userId = 'u' + (this.users().length + 1);
    let avatarPath = this.getDefaultAvatar();

    if (avatarData) {
      avatarPath = this.imageStorage.saveImageToLocalStorage(userId, avatarData);
    }

    const newUser: User = {
      id: userId,
      name: name,
      avatar: avatarPath,
    };

    this.users.update((currentUsers) => [...currentUsers, newUser]);
    this.users$.next(this.users());

    return of(newUser);
  }

  private getDefaultAvatar(): string {
    return '/users/default-avatar.jpg';
  }
}
