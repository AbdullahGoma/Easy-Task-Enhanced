import {
  CanMatchFn,
  RedirectCommand,
  Router,
  Routes,
} from '@angular/router';

import { NoTaskComponent } from './tasks/no-task/no-task.component';
import {
  resolveTitle,
  resolveUserName,
  UserTasksComponent,
} from './users/user-tasks/user-tasks.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { inject } from '@angular/core';

const dummyCanMatch: CanMatchFn = (route, segmants) => {
  const router = inject(Router);
  const shouldGetAccess = Math.random();
  return shouldGetAccess < 1
    ? true
    : new RedirectCommand(router.parseUrl('/unauthorized'));
};

export const routes: Routes = [
  // Starting Page so, it does not need to lazy loading
  {
    path: '',
    component: NoTaskComponent,
    children: [
      {
        // Redirect users to ''
        path: 'users',
        redirectTo: '',
        pathMatch: 'prefix',
      },
    ],
    title: 'No Task', // static title
  },
  {
    path: 'users/:userId',
    component: UserTasksComponent,
    // Guard is guard the route and it's children
    canMatch: [dummyCanMatch],
    // Lazy Loading Children
    loadChildren: () =>
      import('./users/users.routes').then((module) => module.routes),
    data: {
      message: 'Hello!',
    },
    resolve: {
      userName: resolveUserName,
    },
    title: resolveTitle,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
