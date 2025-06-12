import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { UsersService } from '../users.service';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterLink,
  RouterOutlet,
  RouterStateSnapshot,
} from '@angular/router';
import { TasksService } from '../../tasks/tasks.service';
import { ModalType } from '../../shared/modals/modal-types';
import { ModalService } from '../../shared/modals/modal.service';
import { AddTaskModalComponent } from '../../shared/modals/modals/add-task-modal/add-task-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

/**
 * Component for displaying and managing tasks for a specific user.
 *
 * Features:
 * - Displays user-specific tasks
 * - Provides multiple ways to get user name (input, observable, resolver or ActivatedRoute.data(access dynamic and static))
 * - Handles task creation via modal
 * - Implements proper cleanup of subscriptions
 */
@Component({
  selector: 'app-user-tasks',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AddTaskModalComponent, RouterLink],
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.css',
})
export class UserTasksComponent implements OnInit {
  //region Inputs
  /**
   * The ID of the user whose tasks are being displayed.
   * Required input that must match the route parameter name.
   */
  userId = input.required<string>();

  /**
   * Optional message passed through route data.
   * Demonstrates route data injection as an input.
   */
  message = input<string>('');

  /**
   * User name resolved via route resolver.
   * Demonstrates alternative pattern for route data.
   */
  userName = input.required<string>();
  //endregion

  //region Services
  private readonly usersService = inject(UsersService);
  private readonly tasksService = inject(TasksService);
  private readonly modalService = inject(ModalService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  //endregion

  //region Computed Properties
  /**
   * Gets the user name using the input userId.
   * Reactive computed property that updates when userId changes.
   */
  readonly userNameUsingIdInput = computed(() => {
    return (
      this.usersService.allUsers.find((user) => user.id === this.userId())
        ?.name ?? 'Unknown User'
    );
  });

  /**
   * Signal for the user name obtained via route params observable.
   * Demonstrates alternative approach to getting route parameters.
   */
  readonly userNameUsingObservable = signal<string>('');

  //region Lifecycle Hooks
  ngOnInit(): void {
    this.initializeRouteParamSubscription();
    this.accessRouteData();
    this.logInitialRouteData();
  }
  //endregion

  //region Public Methods
  /**
   * Opens the add task modal.
   * Demonstrates modal service usage.
   */
  openAddTaskModal(): void {
    this.modalService.openModal(ModalType.AddTask);
  }

  /**
   * Handles task addition from the modal.
   * @param taskData The task data from the modal form
   */
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
  //endregion

  //region Private Methods
  /**
   * Initializes subscription to route parameters.
   * Demonstrates proper subscription cleanup.
   */
  private initializeRouteParamSubscription(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paramMap) => {
          const userName =
            this.usersService.allUsers.find(
              (user) => user.id === paramMap.get('userId')
            )?.name || '';
          this.userNameUsingObservable.set(userName);
        },
        error: (err) =>
          console.error('Error in route param subscription:', err),
      });
  }

  /**
   * Access Route Data In Coponents.
   * Demonstrates that it can access data (static) and resolve (dynamic) that in routes.
   */
  private accessRouteData(): void {
    this.activatedRoute.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => console.log(data),
      });
  }

  /**
   * Logs initial route data for debugging.
   * Demonstrates access to snapshot data.
   */
  private logInitialRouteData(): void {
    console.log(
      'Initial route data - message:',
      this.message(),
      'userId param:',
      this.activatedRoute.snapshot.paramMap.get('userId')
    );
  }
}

/**
 * Route resolver function for user name.
 * Demonstrates resolver pattern for route data.
 *
 * @param route Current activated route snapshot
 * @param state Current router state snapshot
 * @returns Resolved user name
 */
export const resolveUserName: ResolveFn<string> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const usersService = inject(UsersService);
  const userId = route.paramMap.get('userId');

  if (!userId) {
    throw new Error('User ID not found in route parameters');
  }

  const userName = usersService.allUsers.find(
    (user) => user.id === userId
  )?.name;

  if (!userName) {
    console.warn(`User not found with ID: ${userId}`);
    return 'Unknown User';
  }

  return userName;
};
