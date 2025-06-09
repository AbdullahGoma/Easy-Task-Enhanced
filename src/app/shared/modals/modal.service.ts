import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private activeModal = new BehaviorSubject<string | null>(null);
  private modalData = new BehaviorSubject<{ [key: string]: any }>({});

  activeModal$ = this.activeModal.asObservable();

  openModal(modalName: string, data?: any): void {
    this.activeModal.next(modalName);
    if (data) {
      this.modalData.next({
        ...this.modalData.value,
        [modalName]: data,
      });
    }
  }

  closeModal(): void {
    this.activeModal.next(null);
  }

  isModalOpen(modalName: string): boolean {
    return this.activeModal.value === modalName;
  }

  getModalData(modalName: string): any {
    return this.modalData.value[modalName];
  }

  setModalData(modalName: string, data: any): void {
    this.modalData.next({
      ...this.modalData.value,
      [modalName]: data,
    });
  }
}
