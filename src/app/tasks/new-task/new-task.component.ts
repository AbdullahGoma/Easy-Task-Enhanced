import { Component, inject, input } from '@angular/core';
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

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css',
})
export class NewTaskComponent {
  userId = input.required<string>();
  private tasksService = inject(TasksService);
  private fb = inject(FormBuilder);

  taskForm: FormGroup;
  minDate: string;

  constructor() {
    // Set minimum date to today (YYYY-MM-DD format)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      summary: ['', [Validators.required, Validators.minLength(10)]],
      dueDate: ['', [Validators.required, this.futureDateValidator()]],
      dueTime: ['12:00', [Validators.required]],
    });
  }

  // Custom validator for future date and time
  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const dateValue = control.value;
      const timeControl = this.taskForm?.get('dueTime');
      const timeValue = timeControl?.value || '00:00';

      const selectedDateTime = new Date(`${dateValue}T${timeValue}`);
      const now = new Date();

      return selectedDateTime < now ? { pastDate: true } : null;
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

  onTimeChange() {
    // Revalidate date when time changes
    this.dueDate?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    // Combine date and time for the final due datetime
    const dueDateTime = `${this.taskForm.value.dueDate}T${this.taskForm.value.dueTime}:00`;

    this.tasksService.addTask(
      {
        title: this.taskForm.value.title,
        summary: this.taskForm.value.summary,
        date: dueDateTime, // Now includes time
      },
      this.userId()
    );

    this.taskForm.reset({
      dueTime: '12:00', // Reset to default time
    });
  }
}
