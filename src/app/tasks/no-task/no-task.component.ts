import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
  OnInit,
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
import { finalize, Subject, takeUntil } from 'rxjs';
import { UsersService } from '../../users/users.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface UserForm {
  name: FormControl<string | null>;
  avatarFile: FormControl<File | null>;
  avatarData: FormControl<string | null>;
}

@Component({
  selector: 'app-no-task',
  standalone: true,
  templateUrl: './no-task.component.html',
  styleUrls: ['./no-task.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class NoTaskComponent implements OnInit, OnDestroy {
  // Services
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  // State management
  private readonly destroy$ = new Subject<void>();
  readonly showAddUserModal = signal(false);
  readonly isUploading = signal(false);
  readonly errorMessage = signal('');
  readonly avatarPreview = signal<SafeUrl | null>(null);

  // Form
  userForm!: FormGroup;

  // View references
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group<UserForm>({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      avatarFile: new FormControl(null, [
        Validators.required,
        this.fileValidator,
      ]),
      avatarData: new FormControl(null),
    });
  }

  private readonly fileValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const file = control.value as File;
    if (!file) return null;

    const errors: ValidationErrors = {};

    if (!file.type.startsWith('image/')) {
      errors['invalidType'] = true;
    }

    if (file.size > 2 * 1024 * 1024) {
      errors['maxSize'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  //#region Form Helpers
  getControl(controlName: keyof UserForm): AbstractControl | null {
    return this.userForm.get(controlName);
  }

  isControlInvalid(controlName: keyof UserForm): boolean {
    const control = this.getControl(controlName);
    return !!control?.invalid && (control?.dirty || control?.touched);
  }

  hasError(controlName: keyof UserForm, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!control?.errors?.[errorType];
  }
  //#endregion

  //#region Modal Management
  openAddUserModal(): void {
    this.resetFormState();
    this.showAddUserModal.set(true);
  }

  closeAddUserModal(): void {
    this.resetFormState();
    this.showAddUserModal.set(false);
  }

  private resetFormState(): void {
    this.userForm.reset();
    this.errorMessage.set('');
    this.avatarPreview.set(null);
    this.clearFileInput();
  }

  private clearFileInput(): void {
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }
  //#endregion

  onFileSelected(event: Event): void {
    this.errorMessage.set('');
    this.clearPreview();

    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) {
      this.setAvatarFile(null);
      return;
    }

    this.validateAndProcessFile(file);
  }

  private clearPreview(): void {
    this.avatarPreview.set(null);
    this.userForm.patchValue({ avatarData: null });
  }

  private validateAndProcessFile(file: File): void {
    this.setAvatarFile(file);

    if (this.isAvatarFileValid()) {
      this.createImagePreview(file);
    } else {
      this.handleInvalidFile();
    }
  }

  private setAvatarFile(file: File | null): void {
    this.getControl('avatarFile')?.setValue(file);
    this.getControl('avatarFile')?.markAsTouched();
    this.getControl('avatarFile')?.updateValueAndValidity();
  }

  private isAvatarFileValid(): boolean {
    return !this.getControl('avatarFile')?.errors;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = reader.result as string;
      this.avatarPreview.set(this.sanitizer.bypassSecurityTrustUrl(dataUrl));
      this.userForm.patchValue({ avatarData: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  private handleInvalidFile(): void {
    this.clearPreview();
    this.clearFileInput();
  }
  //#endregion

  addNewUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isUploading.set(true);

    this.usersService
      .addUser(this.userForm.value.name, this.userForm.value.avatarData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isUploading.set(false))
      )
      .subscribe({
        next: () => this.closeAddUserModal(),
        error: (err) =>
          this.errorMessage.set(`Error adding user: ${err.message}`),
      });
  }
}
