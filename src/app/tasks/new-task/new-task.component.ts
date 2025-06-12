import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { TasksService } from '../tasks.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTaskComponent {
  userId = input.required<string>();
  private tasksService = inject(TasksService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  taskForm: FormGroup;
  minDate: string;
  currentTime: string;

  constructor() {
    // Set minimum date to today (YYYY-MM-DD format)
    const now = new Date();
    this.minDate = now.toISOString().split('T')[0];
    this.currentTime = this.formatTime(now);

    this.taskForm = this.fb.group(
      {
        title: ['', [Validators.required, Validators.minLength(3)]],
        summary: ['', [Validators.required, Validators.minLength(10)]],
        dueDate: ['', [Validators.required]],
        dueTime: [
          this.currentTime,
          [Validators.required, this.futureTimeValidator()],
        ],
      },
      { validators: this.dateTimeValidator() }
    );
  }

  // Format time as HH:MM
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Validator for time (when date is today)
  private futureTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !this.taskForm) return null;

      const dateValue = this.taskForm.get('dueDate')?.value;
      if (!dateValue) return null;

      const today = new Date().toISOString().split('T')[0];
      if (dateValue !== today) return null; // Only validate time if date is today

      const [hours, minutes] = control.value.split(':').map(Number);
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      if (
        hours < currentHours ||
        (hours === currentHours && minutes <= currentMinutes)
      ) {
        return { pastTime: true };
      }
      return null;
    };
  }

  // Combined date-time validator
  private dateTimeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const dateControl = group.get('dueDate');
      const timeControl = group.get('dueTime');

      if (!dateControl?.value || !timeControl?.value) return null;

      const selectedDate = new Date(
        `${dateControl.value}T${timeControl.value}`
      );
      const now = new Date();

      return selectedDate < now ? { pastDateTime: true } : null;
    };
  }

  // Helper methods for template
  get title() {
    return this.taskForm.get('title');
  }
  get summary() {
    return this.taskForm.get('summary');
  }
  get dueDate() {
    return this.taskForm.get('dueDate');
  }
  get dueTime() {
    return this.taskForm.get('dueTime');
  }

  isFieldInvalid(field: string): boolean {
    const control = this.taskForm.get(field);
    return !!control?.invalid && (control?.dirty || control?.touched);
  }

  hasError(field: string, error: string): boolean {
    const control = this.taskForm.get(field);
    return !!control?.errors?.[error];
  }

  onDateChange() {
    this.dueTime?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const dueDateTime = `${this.taskForm.value.dueDate}T${this.taskForm.value.dueTime}`;

    this.tasksService.addTask(
      {
        title: this.taskForm.value.title,
        summary: this.taskForm.value.summary,
        date: dueDateTime,
      },
      this.userId()
    );

    this.taskForm.reset({
      dueTime: this.currentTime, // Reset to current time
    });

    this.router.navigate(['/users', this.userId(), 'tasks'], {
      replaceUrl: true, // Replace Url to make user not go back to the form again (We Can use it in login or signUp pages, Redirecting from a modal or stepper)
    });
  }
}
