import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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

  // Observable for modal state
  isOpen = false;

  // Outputs
  @Output() taskAdded = new EventEmitter<{
    title: string;
    summary: string;
    dueDate: string;
  }>();

  // State
  isSubmitting = false;
  errorMessage = '';

  // Form
  taskForm!: FormGroup;

  constructor() {
    this.modalService
      .isModalOpen(ModalType.AddTask)
      .pipe(takeUntilDestroyed())
      .subscribe((open) => {
        this.isOpen = open;
        this.cdRef.markForCheck(); // Manually trigger change detection
      });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group<TaskForm>({
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
    });
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

  private resetFormState(): void {
    this.taskForm.reset();
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
      this.cdRef.markForCheck(); // Manually trigger change detection
      return;
    }

    this.isSubmitting = true;
    this.cdRef.markForCheck(); // Manually trigger change detection

    try {
      this.taskAdded.emit({
        title: this.taskForm.value.title,
        summary: this.taskForm.value.summary,
        dueDate: this.taskForm.value.dueDate,
      });
      this.closeModal();
    } catch (err) {
      this.errorMessage = `Error adding task: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      this.cdRef.markForCheck(); // Manually trigger change detection
    } finally {
      this.isSubmitting = false;
      this.cdRef.markForCheck(); // Manually trigger change detection
    }
  }
}
