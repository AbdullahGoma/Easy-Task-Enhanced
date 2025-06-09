// image-preview-modal.component.ts
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalService } from '../../modal.service';
import { ModalBackdropComponent } from "../../modal-backdrop.component";

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  templateUrl: './image-preview-modal.component.html',
  styleUrls: ['./image-preview-modal.component.css'],
})
export class ImagePreviewModalComponent {
  private modalService = inject(ModalService);
  private sanitizer = inject(DomSanitizer);

  get isOpen() {
    return this.modalService.isModalOpen('imagePreview');
  }

  get imageUrl(): SafeUrl | null {
    const url = this.modalService.getModalData('imagePreview');
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }

  closeModal() {
    this.modalService.closeModal('imagePreview');
  }
}
