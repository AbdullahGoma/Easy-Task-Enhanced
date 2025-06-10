import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import { ModalService } from '../../modal.service';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalType } from '../../modal-types';

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  templateUrl: './image-preview-modal.component.html',
  styleUrls: ['./image-preview-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewModalComponent {
  private modalService = inject(ModalService);
  private cdRef = inject(ChangeDetectorRef); // Used when 
  // we Use ChangeDetectionStrategy.OnPush to tell angular 
  // that we change a value

  imageUrl: string | null = null;
  isOpen = false;

  constructor() {
    combineLatest([
      this.modalService.getModalData<string>(ModalType.ImagePreview),
      this.modalService.isModalOpen(ModalType.ImagePreview),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([url, open]) => {
        this.imageUrl = url;
        this.isOpen = open;
        this.cdRef.markForCheck(); // here
      });
  }

  closeModal() {
    this.modalService.closeModal(ModalType.ImagePreview);
  }
}
