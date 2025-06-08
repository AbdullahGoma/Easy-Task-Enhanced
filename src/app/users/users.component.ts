import { Component, inject, signal } from '@angular/core';
import { UsersService } from './users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserComponent } from './user/user.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [UserComponent, CommonModule, FormsModule],
})
export class UsersComponent {
  private usersService = inject(UsersService);
  users = this.usersService.allUsers;

  showAddUserModal = signal(false);
  newUserName = signal('');
  selectedAvatar = signal<string | ArrayBuffer | null>(null);
  isUploading = signal(false);
  errorMessage = signal('');

  openAddUserModal() {
    this.showAddUserModal.set(true);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
    this.newUserName.set('');
    this.selectedAvatar.set(null);
    this.errorMessage.set('');
  }

  onFileSelected(event: Event) {
    this.errorMessage.set('');
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.match('image.*')) {
        this.errorMessage.set('Only image files are allowed');
        return;
      }

      // Validate file size (e.g., 2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage.set('File size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.selectedAvatar.set(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  addNewUser() {
    if (!this.newUserName().trim()) {
      this.errorMessage.set('Please enter a user name');
      return;
    }

    this.isUploading.set(true);

    this.usersService
      .addUser(this.newUserName().trim(), this.selectedAvatar())
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: () => this.closeAddUserModal(),
        error: (err) =>
          this.errorMessage.set('Error adding user: ' + err.message),
      });
  }
}
