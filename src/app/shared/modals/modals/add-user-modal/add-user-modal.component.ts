import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
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
import { AsyncPipe, CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalService } from '../../modal.service';
import { Subject } from 'rxjs';
import { ModalBackdropComponent } from "../../modal-backdrop.component";

interface UserForm {
  name: FormControl<string | null>;
  avatarFile: FormControl<File | null>;
  avatarData: FormControl<string | null>;
}

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalBackdropComponent,
    AsyncPipe,
  ],
})
export class AddUserModalComponent implements OnInit, OnDestroy {
  // Services
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly modalService = inject(ModalService);
  private readonly destroy$ = new Subject<void>();

  // Observable for modal state
  isOpen$ = this.modalService.isModalOpen('addUser');

  // Outputs
  @Output() userAdded = new EventEmitter<{
    name: string;
    avatarData: string;
  }>();

  // State
  isUploading = false;
  errorMessage = '';
  avatarPreview: SafeUrl | null = null;

  // View references
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // Form
  userForm!: FormGroup;
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

  // Form Helpers
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

  private resetFormState(): void {
    this.userForm.reset();
    this.errorMessage = '';
    this.avatarPreview = null;
    this.clearFileInput();
  }

  private clearFileInput(): void {
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // File Handling
  onFileSelected(event: Event): void {
    this.errorMessage = '';
    this.clearPreview();

    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) {
      this.setAvatarFile(null);
      return;
    }

    this.validateAndProcessFile(file);
  }

  private clearPreview(): void {
    this.avatarPreview = null;
    this.userForm.patchValue({ avatarData: null });
  }

  private setAvatarFile(file: File | null): void {
    this.getControl('avatarFile')?.setValue(file);
    this.getControl('avatarFile')?.markAsTouched();
    this.getControl('avatarFile')?.updateValueAndValidity();
  }

  private isAvatarFileValid(): boolean {
    return !this.getControl('avatarFile')?.errors;
  }

  private validateAndProcessFile(file: File): void {
    this.setAvatarFile(file);

    if (this.isAvatarFileValid()) {
      this.createImagePreview(file);
    } else {
      this.handleInvalidFile();
    }
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = reader.result as string;
      this.avatarPreview = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
      this.userForm.patchValue({ avatarData: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  private handleInvalidFile(): void {
    this.clearPreview();
    this.clearFileInput();
  }

  // Remove Image
  removeImage(event: Event): void {
    event.stopPropagation();
    this.clearPreview();
    this.clearFileInput();
    this.setAvatarFile(null);
    this.errorMessage = '';
  }

  openImagePreview(): void {
    if (this.avatarPreview) {
      // If avatarPreview is already a SafeUrl, get the string value
      const url =
        typeof this.avatarPreview === 'string'
          ? this.avatarPreview
          : this.sanitizer.sanitize(4, this.avatarPreview);

      if (url) {
        this.modalService.openModal('imagePreview', url);
      }
    }
  }

  // Check if the modal in the list (If the modal in the list will open)
  get IsModalOpen() {
    return this.modalService.isModalOpen('addUser');
  }

  // Modal Management
  closeModal(): void {
    this.resetFormState();
    this.modalService.closeModal('addUser');
  }

  // Submit
  addNewUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;

    try {
      this.userAdded.emit({
        name: this.userForm.value.name,
        avatarData: this.userForm.value.avatarData,
      });
      this.closeModal();
    } catch (err) {
      this.errorMessage = `Error adding user: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
    } finally {
      this.isUploading = false;
    }
  }
}
