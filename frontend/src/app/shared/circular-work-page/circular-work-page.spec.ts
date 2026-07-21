import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CircularWorkPage, CircularWorkPageAction } from './circular-work-page';

@Component({
  imports: [CircularWorkPage],
  template: `
    <app-circular-work-page
      title="Kundenliste"
      description="Wähle eine Kund:in aus."
      contentType="list"
      sourceLabel="Kundenliste"
      originLabel="aus Knoten Kund:innen"
      [primaryActionLabel]="primaryActionLabel()"
      secondaryActionLabel="Schließen"
      [actionButtons]="actionButtons()"
      [busy]="busy()"
      [error]="error()"
      [empty]="empty()"
    >
      <button type="button">Katja Gross auswählen</button>
    </app-circular-work-page>
  `,
})
class CircularWorkPageHost {
  readonly busy = signal(false);
  readonly error = signal('');
  readonly empty = signal(false);
  readonly primaryActionLabel = signal('');
  readonly actionButtons = signal<CircularWorkPageAction[]>([]);
}

function centerOf(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

describe('CircularWorkPage', () => {
  let fixture: ComponentFixture<CircularWorkPageHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularWorkPageHost],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(CircularWorkPageHost);
  });

  it('models list content with origin context, named scroll region and optional primary action', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector<HTMLElement>('[role="dialog"]');
    const contentRegion = host.querySelector<HTMLElement>('[role="region"]');

    expect(dialog?.textContent).toContain('Liste, Kundenliste aus Knoten Kund:innen');
    expect(contentRegion?.getAttribute('aria-label')).toBe('Kundenliste, scrollbarer Inhalt');
    expect(contentRegion?.getAttribute('aria-busy')).toBeNull();
    expect(host.textContent).toContain('Katja Gross auswählen');
    expect(host.textContent).toContain('Schließen');
    expect(host.textContent).not.toContain('Speichern');
  });

  it('renders loading, empty and error states inside the content region', () => {
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();

    let host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="region"]')?.getAttribute('aria-busy')).toBe('true');
    expect(host.textContent).toContain('Kundenliste wird geladen…');

    fixture.componentInstance.busy.set(false);
    fixture.componentInstance.empty.set(true);
    fixture.detectChanges();

    host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Kundenliste enthält noch keine Einträge.');

    fixture.componentInstance.empty.set(false);
    fixture.componentInstance.error.set('Kund:innen konnten nicht geladen werden. Erneut versuchen.');
    fixture.detectChanges();

    host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Kund:innen konnten nicht geladen werden. Erneut versuchen.');
  });

  it('keeps persistent actions circular and named while placing them radially bottom-right', () => {
    fixture.componentInstance.actionButtons.set([
      { id: 'close', label: 'Schließen', icon: 'pi-times', severity: 'contrast', closes: true },
      { id: 'save', label: 'Speichern', icon: 'pi-check', severity: 'primary' },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector<HTMLElement>('.circular-work-page__dialog');
    const actions = host.querySelector<HTMLElement>('.circular-work-page__actions');
    const actionButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('.circular-work-page__action'));

    expect(dialog).withContext('dialog exists').not.toBeNull();
    expect(actions).withContext('action group exists').not.toBeNull();
    expect(actionButtons.length).toBe(2);
    expect(actionButtons.map((button) => button.getAttribute('aria-label'))).toEqual(['Schließen', 'Speichern']);

    for (const button of actionButtons) {
      const style = getComputedStyle(button);
      const width = Number.parseFloat(style.width);
      const height = Number.parseFloat(style.height);

      expect(Math.abs(width - height)).withContext('action is square before radius').toBeLessThan(0.5);
      expect(style.borderRadius).withContext('action is visually circular').toBe('50%');
    }

    const dialogCenter = centerOf(dialog!.getBoundingClientRect());
    const actionsCenter = centerOf(actions!.getBoundingClientRect());
    const offsetX = actionsCenter.x - dialogCenter.x;
    const offsetY = actionsCenter.y - dialogCenter.y;

    const radialAngleDegrees = (Math.atan2(offsetY, offsetX) * 180) / Math.PI;

    expect(offsetX).withContext('actions sit right of panel center').toBeGreaterThan(0);
    expect(offsetY).withContext('actions sit below panel center').toBeGreaterThan(0);
    expect(radialAngleDegrees).withContext('actions follow the roughly bottom-right radial').toBeGreaterThan(25);
    expect(radialAngleDegrees).withContext('actions follow the roughly bottom-right radial').toBeLessThan(55);
  });

  it('keeps title and description visually slim and single line', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const title = host.querySelector<HTMLElement>('.circular-work-page__dialog h2');
    const description = host.querySelector<HTMLElement>('.circular-work-page__description');

    expect(getComputedStyle(title!).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(title!).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(description!).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(description!).textOverflow).toBe('ellipsis');
  });
});
