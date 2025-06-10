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
import { NoTaskComponent } from '../tasks/no-task/no-task.component';
import { toSignal } from '@angular/core/rxjs-interop';

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
  users = toSignal(this.usersService.usersObservable, { initialValue: [] });

  // Drag state
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private scrollLeft = 0;
  private scrollTop = 0;
  private velocity = 0;
  private lastMoveTime = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private animationId: number | null = null;
  private isDesktop = false;

  // Circular scroll state
  private itemWidth = 180; // Width of each user card
  private itemHeight = 120; // Approximate height of each user card (adjust as needed)
  private gap = 1; // Gap between items (0.5rem = 8px)

  ngAfterViewInit() {
    this.checkScreenSize();
    this.setupDragListeners();
    this.setupCircularScroll();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  private setupDragListeners() {
    const container = this.usersContainer.nativeElement;

    // Mouse events
    container.addEventListener('mousedown', this.onDragStart.bind(this));
    container.addEventListener('mousemove', this.onDragMove.bind(this));
    container.addEventListener('mouseup', this.onDragEnd.bind(this));
    container.addEventListener('mouseleave', this.onDragEnd.bind(this));

    // Touch events
    container.addEventListener('touchstart', this.onTouchStart.bind(this), {
      passive: false,
    });
    container.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    container.addEventListener('touchend', this.onDragEnd.bind(this));

    // Prevent default drag behavior on images and other elements
    container.addEventListener('dragstart', (e) => e.preventDefault());
  }

  private setupCircularScroll() {
    const container = this.usersContainer.nativeElement;

    container.addEventListener('scroll', () => {
      if (!this.isDragging) {
        this.handleCircularScroll();
      }
    });
  }

  private handleCircularScroll() {
    const container = this.usersContainer.nativeElement;
    const users = this.users();

    if (!users || users.length === 0) return;

    if (this.isDesktop) {
      // Vertical circular scroll for desktop
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const totalHeight = users.length * (this.itemHeight + this.gap);

      if (scrollTop <= 0) {
        // At top, jump to bottom
        container.scrollTop = totalHeight - containerHeight;
      } else if (scrollTop >= totalHeight - containerHeight) {
        // At bottom, jump to top
        container.scrollTop = 0;
      }
    } else {
      // Horizontal circular scroll for mobile
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const totalWidth = users.length * (this.itemWidth + this.gap);

      if (scrollLeft <= 0) {
        // At left, jump to right
        container.scrollLeft = totalWidth - containerWidth;
      } else if (scrollLeft >= totalWidth - containerWidth) {
        // At right, jump to left
        container.scrollLeft = 0;
      }
    }
  }

  private onDragStart(e: MouseEvent) {
    this.isDragging = true;
    this.startX = e.pageX - this.usersContainer.nativeElement.offsetLeft;
    this.startY = e.pageY - this.usersContainer.nativeElement.offsetTop;
    this.scrollLeft = this.usersContainer.nativeElement.scrollLeft;
    this.scrollTop = this.usersContainer.nativeElement.scrollTop;
    this.lastMoveTime = Date.now();
    this.lastMoveX = e.pageX;
    this.lastMoveY = e.pageY;
    this.velocity = 0;

    // Add grabbing cursor
    this.usersContainer.nativeElement.style.cursor = 'grabbing';

    // Stop any ongoing momentum animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    this.isDragging = true;
    this.startX = touch.pageX - this.usersContainer.nativeElement.offsetLeft;
    this.startY = touch.pageY - this.usersContainer.nativeElement.offsetTop;
    this.scrollLeft = this.usersContainer.nativeElement.scrollLeft;
    this.scrollTop = this.usersContainer.nativeElement.scrollTop;
    this.lastMoveTime = Date.now();
    this.lastMoveX = touch.pageX;
    this.lastMoveY = touch.pageY;
    this.velocity = 0;

    // Stop any ongoing momentum animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private onDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastMoveTime;

    if (this.isDesktop) {
      const y = e.pageY - this.usersContainer.nativeElement.offsetTop;
      const walkY = (y - this.startY) * 2; // Multiply by 2 for faster scrolling
      this.usersContainer.nativeElement.scrollTop = this.scrollTop - walkY;

      // Calculate velocity for momentum
      const deltaY = e.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = e.pageY;
    } else {
      const x = e.pageX - this.usersContainer.nativeElement.offsetLeft;
      const walkX = (x - this.startX) * 2; // Multiply by 2 for faster scrolling
      this.usersContainer.nativeElement.scrollLeft = this.scrollLeft - walkX;

      // Calculate velocity for momentum
      const deltaX = e.pageX - this.lastMoveX;
      this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
      this.lastMoveX = e.pageX;
    }

    this.lastMoveTime = currentTime;
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastMoveTime;

    if (this.isDesktop) {
      const y = touch.pageY - this.usersContainer.nativeElement.offsetTop;
      const walkY = (y - this.startY) * 2;
      this.usersContainer.nativeElement.scrollTop = this.scrollTop - walkY;

      const deltaY = touch.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = touch.pageY;
    } else {
      const x = touch.pageX - this.usersContainer.nativeElement.offsetLeft;
      const walkX = (x - this.startX) * 2;
      this.usersContainer.nativeElement.scrollLeft = this.scrollLeft - walkX;

      const deltaX = touch.pageX - this.lastMoveX;
      this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
      this.lastMoveX = touch.pageX;
    }

    this.lastMoveTime = currentTime;
  }

  private onDragEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.usersContainer.nativeElement.style.cursor = 'grab';

    // Apply momentum scrolling
    if (Math.abs(this.velocity) > 0.1) {
      this.applyMomentum();
    }
  }

  private applyMomentum() {
    const container = this.usersContainer.nativeElement;
    const friction = 0.95;
    const minVelocity = 0.1;

    const animate = () => {
      this.velocity *= friction;

      if (Math.abs(this.velocity) < minVelocity) {
        this.animationId = null;
        return;
      }

      if (this.isDesktop) {
        container.scrollTop -= this.velocity * 16; // 16ms frame time
      } else {
        container.scrollLeft -= this.velocity * 16;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }
}
