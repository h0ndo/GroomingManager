import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home',
  imports: [AnimateOnScrollModule, ButtonModule, CardModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly highlights = [
    { value: 'Online', label: 'Buchung & Anfrage' },
    { value: 'Pfote', label: 'Tierprofile mit Notizen' },
    { value: 'Plan', label: 'Tagesübersicht für Groomer' },
  ];

  protected readonly services = [
    'Baden & Föhnen',
    'Schneiden & Styling',
    'Trimmen',
    'Krallenpflege',
    'Ohrenpflege',
    'Komplettpakete',
  ];

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  protected login(): void {
    this.auth.login();
  }

  protected register(): void {
    this.auth.register();
  }
}
