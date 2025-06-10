import { Component, inject } from '@angular/core';
import { ModalService } from '../../shared/modals/modal.service';
import { UsersService } from '../../users/users.service';
import { AddUserModalComponent } from "../../shared/modals/modals/add-user-modal/add-user-modal.component";
import { ImagePreviewModalComponent } from "../../shared/modals/modals/image-preview-modal/image-preview-modal.component";
import { ModalType } from '../../shared/modals/modal-types';

@Component({
  selector: 'app-no-task',
  standalone: true,
  templateUrl: './no-task.component.html',
  styleUrls: ['./no-task.component.css'],
  imports: [AddUserModalComponent, ImagePreviewModalComponent],
})
export class NoTaskComponent {
  private modalService = inject(ModalService);
  private usersService = inject(UsersService);

  openAddUserModal(): void {
    this.modalService.openModal(ModalType.AddUSER);
  }

  handleUserAdded(userData: { name: string; avatarData: string }): void {
    this.usersService.addUser(userData.name, userData.avatarData).subscribe({
      error: (err) => console.error('Error adding user:', err),
    });
  }
}
