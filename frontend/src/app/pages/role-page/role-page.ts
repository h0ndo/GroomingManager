import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

type RolePageData = {
  eyebrow: string;
  title: string;
  roleLabel: string;
  description: string;
  tagSeverity: 'success' | 'info' | 'warn';
  items: string[];
};

@Component({
  selector: 'app-role-page',
  imports: [ButtonModule, CardModule, RouterLink, TagModule],
  templateUrl: './role-page.html',
  styleUrl: './role-page.scss',
})
export class RolePage {
  private readonly route = inject(ActivatedRoute);

  protected readonly page = computed<RolePageData>(() => this.route.snapshot.data as RolePageData);
}
