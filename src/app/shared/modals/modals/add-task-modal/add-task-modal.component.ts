import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../modal.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalType } from '../../modal-types';
import { ModalBackdropComponent } from '../../modal-backdrop.component';

interface TaskForm {
  title: FormControl<string | null>;
  summary: FormControl<string | null>;
  dueDate: FormControl<string | null>;
  dueTime: FormControl<string | null>;
}

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule, ModalBackdropComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskModalComponent implements OnInit {
  // Services
  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(ModalService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Observable for modal state
  isOpen = false;
  minDate: string;
  currentTime: string;

  // Outputs
  @Output() taskAdded = new EventEmitter<{
    title: string;
    summary: string;
    dueDate: string;
    dueTime: string;
  }>();

  // State
  isSubmitting = false;
  errorMessage = '';

  // Form
  taskForm!: FormGroup;

  constructor() {
    // Set minimum date to today (YYYY-MM-DD format)
    const now = new Date();
    this.minDate = now.toISOString().split('T')[0];
    this.currentTime = this.formatTime(now);
  }

  ngOnInit(): void {
    this.initializeForm();

    this.modalService
      .isModalOpen(ModalType.AddTask)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((open) => {
        this.isOpen = open;
        this.cdRef.markForCheck();
      });
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group<TaskForm>(
      {
        title: new FormControl('', [
          Validators.required,
          Validators.minLength(3),
        ]),
        summary: new FormControl('', [
          Validators.required,
          Validators.minLength(10),
        ]),
        dueDate: new FormControl('', [
          Validators.required,
          this.futureDateValidator(),
        ]),
        dueTime: new FormControl(this.currentTime, [
          Validators.required,
          this.futureTimeValidator(),
        ]),
      },
      { validators: this.dateTimeValidator() }
    );
  }

  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return selectedDate < today ? { pastDate: true } : null;
    };
  }

  private futureTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !this.taskForm) return null;

      const dateValue = this.taskForm.get('dueDate')?.value;
      if (!dateValue) return null;

      const today = new Date().toISOString().split('T')[0];
      if (dateValue !== today) return null;

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

  // Form Helpers
  getControl(controlName: keyof TaskForm): AbstractControl | null {
    return this.taskForm.get(controlName);
  }

  isControlInvalid(controlName: keyof TaskForm): boolean {
    const control = this.getControl(controlName);
    return !!control?.invalid && (control?.dirty || control?.touched);
  }

  hasError(controlName: keyof TaskForm, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!control?.errors?.[errorType];
  }

  onDateChange() {
    this.getControl('dueTime')?.updateValueAndValidity();
  }

  private resetFormState(): void {
    this.taskForm.reset({
      dueTime: this.currentTime,
    });
    this.errorMessage = '';
  }

  // Modal Management
  closeModal(): void {
    this.resetFormState();
    this.modalService.closeModal(ModalType.AddTask);
  }

  // Submit
  addNewTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.cdRef.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.cdRef.markForCheck();

    try {
      this.taskAdded.emit({
        title: this.taskForm.value.title,
        summary: this.taskForm.value.summary,
        dueDate: this.taskForm.value.dueDate,
        dueTime: this.taskForm.value.dueTime,
      });
      this.closeModal();
    } catch (err) {
      this.errorMessage = `Error adding task: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      this.cdRef.markForCheck();
    } finally {
      this.isSubmitting = false;
      this.cdRef.markForCheck();
    }
  }
}
