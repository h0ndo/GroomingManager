import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { Home } from './home';

class AuthServiceStub {
  isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue(false);
  login = jasmine.createSpy('login');
  register = jasmine.createSpy('register');
}

describe('Home', () => {
  let auth: AuthServiceStub;
  let router: jasmine.SpyObj<Router>;
  let fixture: ComponentFixture<Home>;

  function requiredElement<T extends HTMLElement>(selector: string): T {
    const element = fixture.nativeElement.querySelector(selector) as T | null;
    expect(element).withContext(`${selector} is rendered`).not.toBeNull();

    return element as T;
  }

  beforeEach(async () => {
    auth = new AuthServiceStub();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('keeps anonymous visitors on the public landing page', () => {
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('sends authenticated users straight to the dashboard', () => {
    auth.isAuthenticated.and.returnValue(true);

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/dashboard');
  });

  it('keeps hero copy and primary CTAs visible despite AnimateOnScroll initial opacity', () => {
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const heroCopy = requiredElement<HTMLElement>('[data-testid="home-hero-copy"]');
    const loginButton = requiredElement<HTMLButtonElement>(
      '.actions button:first-of-type',
    );
    const registerButton = requiredElement<HTMLButtonElement>(
      '.actions button:nth-of-type(2)',
    );

    expect(getComputedStyle(heroCopy).opacity).not.toBe('0');

    loginButton.focus();
    expect(document.activeElement).toBe(loginButton);
    expect(getComputedStyle(loginButton).opacity).not.toBe('0');

    registerButton.focus();
    expect(document.activeElement).toBe(registerButton);
    expect(getComputedStyle(registerButton).opacity).not.toBe('0');
  });

  it('renders highlight cards with visible fallback opacity before scroll observers fire', () => {
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const highlightCards: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="home-highlight-card"]'),
    );

    expect(highlightCards.length).toBe(3);
    for (const card of highlightCards) {
      expect(card.classList).toContain('landing-reveal--stat');
      expect(getComputedStyle(card).opacity).not.toBe('0');
    }
  });
});
