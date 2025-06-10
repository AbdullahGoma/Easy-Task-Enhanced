import { Injectable, ElementRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DragScrollService {
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
  private isWheeling = false;
  private wheelTimeout: any = null;
  private container!: HTMLElement;
  private isVerticalScroll = false;

  initialize(
    containerRef: ElementRef<HTMLElement>,
    isVerticalScroll: boolean = false
  ) {
    this.container = containerRef.nativeElement;
    this.isVerticalScroll = isVerticalScroll;
    this.checkScreenSize();
    this.setupDragListeners();
    this.setupWheelListener();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.removeEventListeners();
  }

  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  private setupDragListeners() {
    // Mouse events
    this.container.addEventListener('mousedown', this.onDragStart.bind(this));
    this.container.addEventListener('mousemove', this.onDragMove.bind(this));
    this.container.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.container.addEventListener('mouseleave', this.onDragEnd.bind(this));

    // Touch events
    this.container.addEventListener(
      'touchstart',
      this.onTouchStart.bind(this),
      {
        passive: false,
      }
    );
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    this.container.addEventListener('touchend', this.onDragEnd.bind(this));

    // Prevent default drag behavior on images and other elements
    this.container.addEventListener('dragstart', (e) => e.preventDefault());
  }

  private removeEventListeners() {
    // Mouse events
    this.container.removeEventListener(
      'mousedown',
      this.onDragStart.bind(this)
    );
    this.container.removeEventListener('mousemove', this.onDragMove.bind(this));
    this.container.removeEventListener('mouseup', this.onDragEnd.bind(this));
    this.container.removeEventListener('mouseleave', this.onDragEnd.bind(this));

    // Touch events
    this.container.removeEventListener(
      'touchstart',
      this.onTouchStart.bind(this)
    );
    this.container.removeEventListener(
      'touchmove',
      this.onTouchMove.bind(this)
    );
    this.container.removeEventListener('touchend', this.onDragEnd.bind(this));
    this.container.removeEventListener('dragstart', (e) => e.preventDefault());
  }

  private setupWheelListener() {
    const wheelSpeed = 0.5;

    this.container.addEventListener(
      'wheel',
      (e) => {
        if (this.isDesktop) {
          if (this.container.scrollHeight > this.container.clientHeight) {
            e.preventDefault();
            this.isWheeling = true;

            // Clear any pending timeout
            if (this.wheelTimeout) {
              clearTimeout(this.wheelTimeout);
            }

            // Set timeout to reset isWheeling after wheel stops
            this.wheelTimeout = setTimeout(() => {
              this.isWheeling = false;
            }, 100);

            this.container.scrollTop += e.deltaY * wheelSpeed;
          }
        } else {
          if (this.container.scrollWidth > this.container.clientWidth) {
            e.preventDefault();
            this.isWheeling = true;

            if (this.wheelTimeout) {
              clearTimeout(this.wheelTimeout);
            }

            this.wheelTimeout = setTimeout(() => {
              this.isWheeling = false;
            }, 100);

            this.container.scrollLeft += e.deltaY * wheelSpeed;
          }
        }
      },
      { passive: false }
    );
  }

  private onDragStart(e: MouseEvent) {
    this.isDragging = true;
    this.startX = e.pageX - this.container.offsetLeft;
    this.startY = e.pageY - this.container.offsetTop;
    this.scrollLeft = this.container.scrollLeft;
    this.scrollTop = this.container.scrollTop;
    this.lastMoveTime = Date.now();
    this.lastMoveX = e.pageX;
    this.lastMoveY = e.pageY;
    this.velocity = 0;

    // Add grabbing cursor
    this.container.style.cursor = 'grabbing';

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
    this.startX = touch.pageX - this.container.offsetLeft;
    this.startY = touch.pageY - this.container.offsetTop;
    this.scrollLeft = this.container.scrollLeft;
    this.scrollTop = this.container.scrollTop;
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

    if (this.isVerticalScroll || this.isDesktop) {
      const y = e.pageY - this.container.offsetTop;
      const walkY = (y - this.startY) * 2;
      this.container.scrollTop = this.scrollTop - walkY;

      // Calculate velocity for momentum
      const deltaY = e.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = e.pageY;
    } else {
      const x = e.pageX - this.container.offsetLeft;
      const walkX = (x - this.startX) * 2;
      this.container.scrollLeft = this.scrollLeft - walkX;

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

    if (this.isVerticalScroll || this.isDesktop) {
      const y = touch.pageY - this.container.offsetTop;
      const walkY = (y - this.startY) * 2;
      this.container.scrollTop = this.scrollTop - walkY;

      const deltaY = touch.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = touch.pageY;
    } else {
      const x = touch.pageX - this.container.offsetLeft;
      const walkX = (x - this.startX) * 2;
      this.container.scrollLeft = this.scrollLeft - walkX;

      const deltaX = touch.pageX - this.lastMoveX;
      this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
      this.lastMoveX = touch.pageX;
    }

    this.lastMoveTime = currentTime;
  }

  private onDragEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.style.cursor = 'grab';

    // Apply momentum scrolling
    if (Math.abs(this.velocity) > 0.1) {
      this.applyMomentum();
    }
  }

  private applyMomentum() {
    const friction = 0.95;
    const minVelocity = 0.1;

    const animate = () => {
      this.velocity *= friction;

      if (Math.abs(this.velocity) < minVelocity) {
        this.animationId = null;
        return;
      }

      if (this.isVerticalScroll || this.isDesktop) {
        this.container.scrollTop -= this.velocity * 16;
      } else {
        this.container.scrollLeft -= this.velocity * 16;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }
}
