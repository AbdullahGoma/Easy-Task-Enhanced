import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { UsersService } from '../users.service';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { TasksService } from '../../tasks/tasks.service';
import { ModalType } from '../../shared/modals/modal-types';
import { ModalService } from '../../shared/modals/modal.service';
import { AddTaskModalComponent } from "../../shared/modals/modals/add-task-modal/add-task-modal.component";

@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [RouterOutlet, AddTaskModalComponent, RouterLink],
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.css',
})
export class UserTasksComponent implements OnInit {
  userId = input.required<string>(); // must be the same name of the name in path
  private usersService = inject(UsersService);
  private tasksService = inject(TasksService);
  private modalService = inject(ModalService);

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

  openAddTaskModal(): void {
    this.modalService.openModal(ModalType.AddTask);
  }

  handleTaskAdded(taskData: {
    title: string;
    summary: string;
    dueDate: string;
  }): void {
    this.tasksService.addTask(
      {
        title: taskData.title,
        summary: taskData.summary,
        date: taskData.dueDate,
      },
      this.userId()
    );
  }

  private destroyRef(subscription: Subscription) {
    this.destroyReference.onDestroy(() => subscription.unsubscribe());
  }
}
