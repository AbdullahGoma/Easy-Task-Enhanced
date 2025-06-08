import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize, Subject, takeUntil } from 'rxjs';
import { UsersService } from '../../users/users.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-no-task',
  standalone: true,
  templateUrl: './no-task.component.html',
  styleUrls: ['./no-task.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class NoTaskComponent implements OnDestroy {
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  showAddUserModal = signal(false);
  isUploading = signal(false);
  errorMessage = signal('');
  avatarPreview = signal<SafeUrl | null>(null);

  userForm!: FormGroup;

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      avatarFile: [null, [Validators.required, this.fileValidator]],
      avatarData: [null],
    });
  }

  private fileValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const file = control.value as File;

    // Required check is already handled by Validators.required
    if (!file) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (!file.type.match('image.*')) {
      errors['invalidType'] = true;
    }

    if (file.size > 2 * 1024 * 1024) {
      errors['maxSize'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  openAddUserModal() {
    this.userForm.reset();
    this.showAddUserModal.set(true);
    this.errorMessage.set('');
    this.avatarPreview.set(null);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
    this.userForm.reset();
    this.errorMessage.set('');
    this.avatarPreview.set(null);

    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  onFileSelected(event: Event) {
    this.errorMessage.set('');
    const input = event.target as HTMLInputElement;
    // Clear previous values
    this.avatarPreview.set(null);
    this.userForm.patchValue({ avatarData: null });

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Set the file value and validate first
      this.userForm.get('avatarFile')?.setValue(file);
      this.userForm.get('avatarFile')?.markAsTouched();
      this.userForm.get('avatarFile')?.updateValueAndValidity();

      // Only create preview if file is valid (not oversized and correct type)
      if (!this.userForm.get('avatarFile')?.errors) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = reader.result as string;
          this.avatarPreview.set(
            this.sanitizer.bypassSecurityTrustUrl(dataUrl)
          );
          this.userForm.patchValue({ avatarData: dataUrl });
        };
        reader.readAsDataURL(file);
      } else {
        // Clear preview if file is invalid
        this.avatarPreview.set(null);
        this.userForm.patchValue({ avatarData: null });

        // Reset the file input if file is invalid
        if (this.fileInputRef) {
          this.fileInputRef.nativeElement.value = '';
        }
      }
    } else {
      // Clear the value if no file selected
      this.userForm.get('avatarFile')?.setValue(null);
      this.avatarPreview.set(null);
      this.userForm.patchValue({ avatarData: null });
    }
  }

  // Helper to safely get form control
  getControl(controlName: string): AbstractControl | null {
    return this.userForm.get(controlName);
  }

  // Helper to check if control is invalid and touched/dirty
  isControlInvalid(controlName: string): boolean {
    const control = this.getControl(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // Helper to get specific error
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!control && !!control.errors && !!control.errors[errorType];
  }

  addNewUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isUploading.set(true);

    this.usersService
      .addUser(
        this.userForm.value.name,
        this.userForm.value.avatarData // Use the stored base64 data
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isUploading.set(false))
      )
      .subscribe({
        next: () => this.closeAddUserModal(),
        error: (err) =>
          this.errorMessage.set('Error adding user: ' + err.message),
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
