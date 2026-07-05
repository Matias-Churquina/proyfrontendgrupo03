import { Component,inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../../services/login-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  public loginService = inject(LoginService);

  cerrarSesion(): void {
    this.loginService.cerrarSesion();
  }
}
