import { Component,inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../../services/login-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  public loginService = inject(LoginService);

  cerrarSesion(): void {
    this.loginService.cerrarSesion();
  }
}
