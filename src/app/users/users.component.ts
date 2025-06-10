import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { UserComponent } from './user/user.component';
import { UsersService } from './users.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DragScrollService } from '../drag-scroll.service';

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  imports: [UserComponent],
})
export class UsersComponent implements AfterViewInit, OnDestroy {
  @ViewChild('usersContainer', { static: false })
  usersContainer!: ElementRef<HTMLUListElement>;

  private usersService = inject(UsersService);
  private dragScrollService = inject(DragScrollService);
  users = toSignal(this.usersService.usersObservable, { initialValue: [] });

  ngAfterViewInit() {
    this.dragScrollService.initialize(this.usersContainer);
  }

  ngOnDestroy() {
    this.dragScrollService.destroy();
  }

  @HostListener('window:resize')
  onResize() {
    this.dragScrollService.onResize();
  }
}
