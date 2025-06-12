import { Injectable, ElementRef } from '@angular/core';

/**
 * Service that enables drag-to-scroll functionality for horizontal or vertical containers.
 *
 * Features:
 * - Mouse and touch event handling
 * - Momentum scrolling after drag release
 * - Wheel scrolling support
 * - Responsive behavior (different handling for desktop/mobile)
 * - Clean event listener management
 *
 * Usage:
 * 1. Inject service in your component
 * 2. Call initialize() with ElementRef in ngAfterViewInit
 * 3. Call destroy() in ngOnDestroy
 * 4. Call onResize() when window resizes
 */
@Injectable({
  providedIn: 'root',
})
export class DragScrollService {
  //region Drag State Properties
  /** Flag indicating if a drag operation is in progress */
  private isDragging = false;

  /** X-coordinate where drag started */
  private startX = 0;

  /** Y-coordinate where drag started */
  private startY = 0;

  /** Scroll position when drag started */
  private scrollLeft = 0;

  /** Scroll position when drag started */
  private scrollTop = 0;

  /** Current scrolling velocity (pixels/ms) */
  private velocity = 0;

  /** Timestamp of last move event */
  private lastMoveTime = 0;

  /** X-coordinate of last move event */
  private lastMoveX = 0;

  /** Y-coordinate of last move event */
  private lastMoveY = 0;

  /** ID of current animation frame request */
  private animationId: number | null = null;

  /** Flag indicating desktop viewport */
  private isDesktop = false;

  /** Flag indicating wheel event is active */
  private isWheeling = false;

  /** Timeout ID for wheel event reset */
  private wheelTimeout: any = null;

  /** Reference to the container element */
  private container!: HTMLElement;

  /** Flag for vertical scrolling mode */
  private isVerticalScroll = false;
  //endregion

  //region Public Methods
  /**
   * Initializes the drag scroll service for a container element
   * @param containerRef ElementRef of the scrollable container
   * @param isVerticalScroll Whether scrolling should be vertical (default horizontal)
   */
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

  /**
   * Cleans up event listeners and cancels animations
   * Must be called when component is destroyed
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.removeEventListeners();
  }

  /**
   * Handles screen size changes
   * Should be called on window resize events
   */
  onResize() {
    this.checkScreenSize();
  }
  //endregion

  //region Private Methods
  /**
   * Checks screen size and updates isDesktop flag
   */
  private checkScreenSize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  /**
   * Sets up all drag-related event listeners
   */
  private setupDragListeners() {
    // Mouse events
    this.container.addEventListener('mousedown', this.onDragStart.bind(this));
    this.container.addEventListener('mousemove', this.onDragMove.bind(this));
    this.container.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.container.addEventListener('mouseleave', this.onDragEnd.bind(this));

    // Touch events (with passive: false for better control)
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

    // Prevent default drag behavior on draggable elements
    this.container.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /**
   * Removes all event listeners
   */
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

  /**
   * Sets up wheel event listener for scrolling
   */
  private setupWheelListener() {
    const wheelSpeed = 0.5; // Control wheel scroll speed

    this.container.addEventListener(
      'wheel',
      (e) => {
        if (this.isDesktop) {
          // Vertical scrolling for desktop
          if (this.container.scrollHeight > this.container.clientHeight) {
            e.preventDefault();
            this.handleWheelEvent(e.deltaY * wheelSpeed, 'vertical');
          }
        } else {
          // Horizontal scrolling for mobile
          if (this.container.scrollWidth > this.container.clientWidth) {
            e.preventDefault();
            this.handleWheelEvent(e.deltaY * wheelSpeed, 'horizontal');
          }
        }
      },
      { passive: false } // Important for preventing default scroll behavior
    );
  }

  /**
   * Handles wheel event with debouncing
   * @param delta Scroll delta value
   * @param direction Scroll direction ('vertical' or 'horizontal')
   */
  private handleWheelEvent(
    delta: number,
    direction: 'vertical' | 'horizontal'
  ) {
    this.isWheeling = true;

    // Clear any pending timeout
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }

    // Set timeout to reset isWheeling after wheel stops
    this.wheelTimeout = setTimeout(() => {
      this.isWheeling = false;
    }, 100);

    // Apply scroll based on direction
    if (direction === 'vertical') {
      this.container.scrollTop += delta;
    } else {
      this.container.scrollLeft += delta;
    }
  }

  /**
   * Handles drag start event (mouse)
   * @param e Mouse event
   */
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

    // Visual feedback
    this.container.style.cursor = 'grabbing';

    // Stop any ongoing momentum animation
    this.cancelMomentumAnimation();
  }

  /**
   * Handles touch start event
   * @param e Touch event
   */
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
    this.cancelMomentumAnimation();
  }

  /**
   * Handles drag move event (mouse)
   * @param e Mouse event
   */
  private onDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastMoveTime;

    if (this.isVerticalScroll || this.isDesktop) {
      // Vertical scrolling logic
      const y = e.pageY - this.container.offsetTop;
      const walkY = (y - this.startY) * 2; // Multiply for better feel
      this.container.scrollTop = this.scrollTop - walkY;

      // Calculate velocity for momentum
      const deltaY = e.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = e.pageY;
    } else {
      // Horizontal scrolling logic
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

  /**
   * Handles touch move event
   * @param e Touch event
   */
  private onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastMoveTime;

    if (this.isVerticalScroll || this.isDesktop) {
      // Vertical scrolling logic
      const y = touch.pageY - this.container.offsetTop;
      const walkY = (y - this.startY) * 2;
      this.container.scrollTop = this.scrollTop - walkY;

      const deltaY = touch.pageY - this.lastMoveY;
      this.velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      this.lastMoveY = touch.pageY;
    } else {
      // Horizontal scrolling logic
      const x = touch.pageX - this.container.offsetLeft;
      const walkX = (x - this.startX) * 2;
      this.container.scrollLeft = this.scrollLeft - walkX;

      const deltaX = touch.pageX - this.lastMoveX;
      this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
      this.lastMoveX = touch.pageX;
    }

    this.lastMoveTime = currentTime;
  }

  /**
   * Handles drag end event
   */
  private onDragEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.style.cursor = 'grab';

    // Apply momentum scrolling if velocity is sufficient
    if (Math.abs(this.velocity) > 0.1) {
      this.applyMomentum();
    }
  }

  /**
   * Applies momentum scrolling after drag ends
   */
  private applyMomentum() {
    const friction = 0.95; // Determines how quickly momentum slows down
    const minVelocity = 0.1; // Minimum velocity to continue animation

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

  /**
   * Cancels any ongoing momentum animation
   */
  private cancelMomentumAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  //endregion
}
