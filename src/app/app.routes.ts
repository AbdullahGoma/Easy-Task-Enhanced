import {
  CanDeactivateFn,
  CanMatchFn,
  RedirectCommand,
  Router,
  Routes,
} from '@angular/router';

import { routes as userRoutes } from './users/users.routes';
import { NoTaskComponent } from './tasks/no-task/no-task.component';
import {
  resolveTitle,
  resolveUserName,
  UserTasksComponent,
} from './users/user-tasks/user-tasks.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { inject } from '@angular/core';
import { NewTaskComponent } from './tasks/new-task/new-task.component';

// const dummyCanMatch: CanMatchFn = (route, segmants) => {
//   const router = inject(Router);
//   const shouldGetAccess = Math.random();
//   return shouldGetAccess < 0.5
//     ? true
//     : new RedirectCommand(router.parseUrl('/unauthorized'));
// };

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
    // canMatch: [dummyCanMatch],
    children: userRoutes,
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
