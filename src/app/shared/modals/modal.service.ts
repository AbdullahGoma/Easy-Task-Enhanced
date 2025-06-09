import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private activeModals = new BehaviorSubject<string[]>([]);
  private modalData = new BehaviorSubject<{ [key: string]: any }>({});

  activeModals$ = this.activeModals.asObservable();

  openModal(modalName: string, data?: any): void {
    const currentModals = this.activeModals.value;
    if (!currentModals.includes(modalName)) {
      this.activeModals.next([...currentModals, modalName]);
      if (data) {
        this.modalData.next({
          ...this.modalData.value,
          [modalName]: data,
        });
      }
    }
  }

  closeModal(modalName: string): void {
    const currentModals = this.activeModals.value;
    this.activeModals.next(currentModals.filter((m) => m !== modalName));
  }

  isModalOpen(modalName: string): boolean {
    return this.activeModals.value.includes(modalName);
  }

  getModalData(modalName: string): any {
    return this.modalData.value[modalName];
  }
}
