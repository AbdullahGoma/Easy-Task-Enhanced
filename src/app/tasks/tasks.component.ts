import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';

import { TaskComponent } from './task/task.component';
import { TasksService } from './tasks.service';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  imports: [TaskComponent, RouterOutlet, RouterLink],
})
export class TasksComponent implements OnInit {
  userId = input.required<string>();
  order = input<'asc' | 'desc'>();
  private tastsService = inject(TasksService);
  userTasks = computed(() => {
    return this.tastsService
      .allTasks()
      .filter((task) => task.userId === this.userId());
  });

  // Using Observable
  private activatedRoute = inject(ActivatedRoute);
  private destroyReference = inject(DestroyRef);
  orderParam?: 'asc' | 'desc';

  ngOnInit(): void {
    const subscription = this.activatedRoute.queryParams.subscribe({
      next: (params) => (this.orderParam = params['order']),
    });

    this.destroyRef(subscription);
  }

  private destroyRef(subscription: Subscription) {
    this.destroyReference.onDestroy(() => subscription.unsubscribe());
  }
}
