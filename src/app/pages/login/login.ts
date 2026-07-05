import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService, LoginPayload } from '../../services/login-service';
import { SesionService, UsuarioSesion } from '../../services/sesion.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private sesionService = inject(SesionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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

        if (res.status !== 1) {
          this.mensajeError = res.msg || 'Credenciales incorrectas';
          this.cdr.detectChanges();
          return;
        }

        if (!res.token || !res.rol || !res.idUsuario || !res.nombre || !res.apellido || !res.email) {
          this.mensajeError = 'La respuesta del servidor no contiene los datos de sesion necesarios.';
          this.cdr.detectChanges();
          return;
        }

        const usuarioSesion: UsuarioSesion = {
          idUsuario: res.idUsuario,
          idChofer: res.idChofer,
          idPasajero: res.idPasajero,
          idAdmin: res.idAdmin,
          rol: res.rol,
          nombre: res.nombre,
          apellido: res.apellido,
          email: res.email,
          estadoChofer: res.estadoChofer,
          estadoPasajero: res.estadoPasajero,
          estadoAdmin: res.estadoAdmin,
          token: res.token,
        };

        this.sesionService.guardarSesion(usuarioSesion);

        if (res.rol === 'CHOFER') {
          this.mensajeExito = 'Inicio de sesion exitoso. Redirigiendo a la pagina de chofer...';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/chofer']), 1000);
          return;
        }

        if (res.rol === 'PASAJERO') {
          this.mensajeExito = 'Inicio de sesion exitoso. Redirigiendo a la pagina de pasajero...';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/pasajero']), 1000);
          return;
        }

        this.mensajeExito = 'Inicio de sesion exitoso. Redirigiendo al inicio...';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      error: (err) => {
        console.error('Error del servidor:', err);
        this.cargando = false;
        this.mensajeError = err.error?.msg || 'Error de conexion con el servidor. Intente mas tarde.';
        this.cdr.detectChanges();
      },
    });
  }
}
