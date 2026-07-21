import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CircularWorkPage } from './circular-work-page';

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
});
