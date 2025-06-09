// modal.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private activeModals = new BehaviorSubject<string[]>([]);
  private modalData = new BehaviorSubject<{ [key: string]: any }>({});

  // Use getters for better encapsulation
  get activeModals$() {
    return this.activeModals
      .asObservable()
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      );
  }

  isModalOpen(modalName: string) {
    return this.activeModals.pipe(
      map((modals) => modals.includes(modalName)),
      distinctUntilChanged()
    );
  }

  getModalData<T>(modalName: string) {
    return this.modalData.pipe(
      map((data) => data[modalName] as T),
      distinctUntilChanged()
    );
  }

  openModal(modalName: string, data?: any) {
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

  closeModal(modalName: string) {
    const currentModals = this.activeModals.value;
    this.activeModals.next(currentModals.filter((m) => m !== modalName));
  }
}
