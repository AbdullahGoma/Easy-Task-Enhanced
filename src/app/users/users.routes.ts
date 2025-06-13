import { Routes } from '@angular/router';
import {
  canLeaveEditPage,
  NewTaskComponent,
} from '../tasks/new-task/new-task.component';

import { resolveUserTasks, TasksComponent } from '../tasks/tasks.component';

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
    // loadComponent: () =>
    //   import('../tasks/tasks.component').then(
    //     (module) => module.TasksComponent
    //   ),
    component: TasksComponent,
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
