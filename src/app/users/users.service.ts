import { Injectable, signal } from '@angular/core';

import { DUMMY_USERS } from '../../dummy-users';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from './user/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private users = signal<User[]>(DUMMY_USERS);
  private users$ = new BehaviorSubject<User[]>(DUMMY_USERS);

  get allUsers() {
    return this.users();
  }

  get usersObservable() {
    return this.users$.asObservable();
  }

  addUser(name: string, avatar: string | ArrayBuffer | null): Observable<User> {
    const newUser: User = {
      id: 'u' + (this.users().length + 1),
      name: name,
      avatar: avatar || this.getDefaultAvatar(),
    };

    this.users.update((currentUsers) => [...currentUsers, newUser]);
    this.users$.next(this.users());

    return of(newUser);
  }

  private getDefaultAvatar(): string {
    return 'default-avatar.jpg';
  }
}
