import {
  Component,
  inject,
  input,
} from '@angular/core';

import { TaskComponent } from './task/task.component';
import { ResolveFn, RouterLink, RouterOutlet } from '@angular/router';
import { Task } from './task/task.model';
import { TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  imports: [TaskComponent, RouterOutlet, RouterLink],
})
export class TasksComponent {
  userTasks = input.required<Task[]>();
  userId = input.required<string>();
  order = input<'asc' | 'desc' | undefined>();
}


export const resolveUserTasks: ResolveFn<Task[]> = (
  activatedRouteSnapshot,
  routerState
) => {
  const order = activatedRouteSnapshot.queryParams['order'];
  const tasksService = inject(TasksService);
  const tasks = tasksService
    .allTasks()
    .filter(
      (task) => task.userId === activatedRouteSnapshot.paramMap.get('userId')
    );

  if (order && order === 'asc') {
    tasks.sort((a, b) => (a.id > b.id ? 1 : -1));
  } else {
    tasks.sort((a, b) => (a.id > b.id ? -1 : 1));
  }

  return tasks.length ? tasks : [];
};

// export class TasksComponent implements OnInit {
//   userId = input.required<string>();
//   order = input<'asc' | 'desc'>();
//   private tastsService = inject(TasksService);
//   userTasks = computed(() => {
//     return this.tastsService
//       .allTasks()
//       .filter((task) => task.userId === this.userId())
//       .sort((a, b) => {
//         return this.orderParam() === 'desc' && a.id > b.id ? -1 : 1; 
//       });
//   });

//   // Using Observable
//   private activatedRoute = inject(ActivatedRoute);
//   private destroyReference = inject(DestroyRef);
//   orderParam = signal<'asc' | 'desc'>('desc');

//   ngOnInit(): void {
//     const subscription = this.activatedRoute.queryParams.subscribe({
//       next: (params) => this.orderParam.set(params['order']),
//     });

//     this.destroyRef(subscription);
//   }

//   private destroyRef(subscription: Subscription) {
//     this.destroyReference.onDestroy(() => subscription.unsubscribe());
//   }
// }
