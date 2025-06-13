import { ResolveFn, Routes } from '@angular/router';
import {
  canLeaveEditPage,
  NewTaskComponent,
} from '../tasks/new-task/new-task.component';
import { Task } from '../tasks/task/task.model';
import { TasksService } from '../tasks/tasks.service';
import { inject } from '@angular/core';


const resolveUserTasks: ResolveFn<Task[]> = (
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

export const routes: Routes = [
  {
    // Redirect to users/userId/tasks
    path: '',
    redirectTo: 'tasks',
    pathMatch: 'prefix',
  },
  {
    path: 'tasks',
    // import is a function yeild a promise, then (module: content of the file)
    loadComponent: () =>
      import('../tasks/tasks.component').then(
        (module) => module.TasksComponent
      ),
    runGuardsAndResolvers: 'always', // Make it For Handle order asc and desc
    resolve: {
      userTasks: resolveUserTasks,
    },
  },
  {
    path: 'tasks/new',
    component: NewTaskComponent,
    canDeactivate: [canLeaveEditPage],
  },
];
