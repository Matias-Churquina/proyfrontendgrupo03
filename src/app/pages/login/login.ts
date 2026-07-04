import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService, LoginPayload } from '../../services/login-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  iniciarSesion(): void {
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const credenciales: LoginPayload = this.loginForm.value;

    this.loginService.login(credenciales).subscribe({
      next: (res) => {
        this.cargando = false;

        if (res.status === 1) {
          this.loginService.guardarSesion(res);

          if (res.rol === 'CHOFER') {
            this.mensajeExito = 'Inicio de sesión exitoso. Redirigiendo a la página de chofer...';
            this.cdr.detectChanges();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          } else if (res.rol === 'PASAJERO') {
            this.mensajeExito = 'Inicio de sesión exitoso. Redirigiendo a la página de pasajero...';
            this.cdr.detectChanges();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          } else if (res.rol === 'ADMIN') {
            this.mensajeExito = 'Inicio de sesión exitoso. Redirigiendo a la página de administrador...';
            this.cdr.detectChanges();
            setTimeout(() => {
              this.router.navigate(['/admin']);
            }, 3000);
          }

        } else {

          this.mensajeError = res.msg;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error del servidor:', err);
        this.cargando = false;
        this.mensajeError = 'Error de conexión con el servidor. Intente más tarde.';
        this.cdr.detectChanges();
      }
    });
  }
}
