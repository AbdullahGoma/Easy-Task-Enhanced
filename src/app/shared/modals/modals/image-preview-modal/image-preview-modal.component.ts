import {
  Component,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalService } from '../../modal.service';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  templateUrl: './image-preview-modal.component.html',
  styleUrls: ['./image-preview-modal.component.css'],
})
export class ImagePreviewModalComponent {
  private modalService = inject(ModalService);

  imageUrl: string | null = null;
  isOpen = false;

  constructor() {
    this.modalService
      .getModalData<string>('imagePreview')
      .pipe(takeUntilDestroyed())
      .subscribe((url) => (this.imageUrl = url));

    this.modalService
      .isModalOpen('imagePreview')
      .pipe(takeUntilDestroyed())
      .subscribe((open) => (this.isOpen = open));
  }
  closeModal() {
    this.modalService.closeModal('imagePreview');
  }
}
