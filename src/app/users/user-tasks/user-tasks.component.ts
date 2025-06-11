import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { UsersService } from '../users.service';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.css',
})
export class UserTasksComponent implements OnInit {
  userId = input.required<string>(); // must be the same name of the name in path
  private usersService = inject(UsersService);

  userName = computed(
    () =>
      this.usersService.allUsers.find((user) => user.id === this.userId())?.name
  );

  // Extract Dynamic route parameter as input Using Observable
  private activatedRoute = inject(ActivatedRoute); // Have a pointer to the class loaded
  private destroyReference = inject(DestroyRef);
  userNameUsingObservable = '';

  ngOnInit(): void {
    const subscription = this.activatedRoute.paramMap.subscribe({
      next: (paramMap) => {
        this.userNameUsingObservable =
          this.usersService.allUsers.find(
            (user) => user.id === paramMap.get('userId')
          )?.name || '';
      },
    });

    this.destroyRef(subscription);
  }

  private destroyRef(subscription: Subscription) {
    this.destroyReference.onDestroy(() => subscription.unsubscribe());
  }
}
