import { NgClass, NgStyle } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

export type CircularWorkPageContentType = 'form' | 'search' | 'list' | 'calendar' | 'detail' | 'delete-confirmation';

export type CircularWorkPageOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

@Component({
  selector: 'app-circular-work-page',
  imports: [ButtonModule, NgClass, NgStyle],
  templateUrl: './circular-work-page.html',
  styleUrl: './circular-work-page.scss',
})
export class CircularWorkPage implements AfterViewInit, OnDestroy {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() contentType: CircularWorkPageContentType = 'form';
  @Input() sourceLabel = '';
  @Input() originLabel = '';
  @Input() sourceOrigin?: CircularWorkPageOrigin;
  @Input() primaryActionLabel = 'Speichern';
  @Input() secondaryActionLabel = 'Abbrechen';
  @Input({ transform: booleanAttribute }) busy = false;
  @Input() error = '';
  @Input({ transform: booleanAttribute }) empty = false;
  @Input({ transform: booleanAttribute }) preserveContentWhileBusy = false;

  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialog', { static: true }) private dialog?: ElementRef<HTMLElement>;

  protected readonly isClosing = signal(false);
  protected readonly dialogLabelId = `circular-work-page-title-${Math.random().toString(36).slice(2)}`;
  protected readonly dialogDescriptionId = `circular-work-page-description-${Math.random().toString(36).slice(2)}`;
  protected readonly contentRegionId = `circular-work-page-content-${Math.random().toString(36).slice(2)}`;
  protected accessibleContext(): string {
    const sourceContext = this.originLabel || (this.sourceLabel ? `aus Knoten ${this.sourceLabel}` : '');

    return `${this.contentTypeLabel()}, ${this.title}${sourceContext ? ` ${sourceContext}` : ''}`;
  }

  protected contentRegionLabel(): string {
    return `${this.title}, scrollbarer Inhalt`;
  }

  protected contentStateMessage(): string {
    if (this.busy) {
      return `${this.title} wird geladen…`;
    }

    if (this.error) {
      return this.error;
    }

    if (this.empty) {
      return `${this.title} enthält noch keine Einträge.`;
    }

    return '';
  }

  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  ngAfterViewInit(): void {
    setTimeout(() => this.focusInitialElement());
  }

  ngOnDestroy(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  protected shellStyle(): Record<string, string> {
    const origin = this.sourceOrigin;

    if (!origin || typeof window === 'undefined') {
      return {
        '--work-page-origin-x': '0px',
        '--work-page-origin-y': '0px',
      };
    }

    const originCenterX = origin.x + origin.width / 2;
    const originCenterY = origin.y + origin.height / 2;

    return {
      '--work-page-origin-x': `${originCenterX - window.innerWidth / 2}px`,
      '--work-page-origin-y': `${originCenterY - window.innerHeight / 2}px`,
    };
  }

  protected requestPrimaryAction(): void {
    if (!this.primaryActionLabel || this.busy) {
      return;
    }

    this.primaryAction.emit();
  }

  protected requestSecondaryAction(): void {
    this.secondaryAction.emit();
    this.startClose();
  }

  protected handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = this.focusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected closeWithEscape(event: Event): void {
    if (this.isClosing()) {
      return;
    }

    event.preventDefault();
    this.requestSecondaryAction();
  }

  private startClose(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.closeTimer = setTimeout(() => {
      this.closed.emit();
      this.previouslyFocusedElement?.focus();
    }, 220);
  }

  private focusInitialElement(): void {
    if (this.contentType === 'detail') {
      const detailRegion = this.dialog?.nativeElement.querySelector<HTMLElement>('[tabindex="-1"]');

      if (detailRegion) {
        detailRegion.focus();
        return;
      }
    }

    const candidates = this.focusableElements().filter((element) => !element.classList.contains('circular-work-page__action'));
    const firstField =
      candidates.find((element) => !element.classList.contains('circular-work-page__content')) ?? candidates[0];

    if (firstField) {
      firstField.focus();
      return;
    }

    this.dialog?.nativeElement.focus();
  }

  private focusableElements(): HTMLElement[] {
    const host = this.dialog?.nativeElement;

    if (!host) {
      return [];
    }

    return Array.from(
      host.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null || element === document.activeElement);
  }

  private contentTypeLabel(): string {
    const labels: Record<CircularWorkPageContentType, string> = {
      form: 'Formular',
      search: 'Suche',
      list: 'Liste',
      calendar: 'Kalender',
      detail: 'Detailansicht',
      'delete-confirmation': 'Bestätigung',
    };

    return labels[this.contentType];
  }
}
