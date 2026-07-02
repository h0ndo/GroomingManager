import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-home',
  imports: [ButtonModule, CardModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
