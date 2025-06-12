import { Routes } from "@angular/router";
import { TasksComponent } from "../tasks/tasks.component";
import { NewTaskComponent } from "../tasks/new-task/new-task.component";

export const routes: Routes = [
  {
    // Redirect to users/userId/tasks
    path: '',
    redirectTo: 'tasks',
    pathMatch: 'prefix',
  },
  {
    path: 'tasks',
    component: TasksComponent,
    children: [
      {
        path: '',
        component: NewTaskComponent,
      },
    ],
  },
  {
    path: 'tasks/new',
    component: NewTaskComponent,
  },
];