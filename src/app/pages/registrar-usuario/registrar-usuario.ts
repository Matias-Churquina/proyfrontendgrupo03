import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RegistroService, RegistroPasajeroDTO, RegistroChoferDTO, RegistroAdminDTO } from '../../services/registro-service';

@Component({
  selector: 'app-registrar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registrar-usuario.html'
})
export class RegistrarUsuario implements OnInit {
  private fb = inject(FormBuilder);
  private registroService = inject(RegistroService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  registroForm!: FormGroup;
  rolSeleccionado: 'PASAJERO' | 'CHOFER' | 'ADMIN' = 'PASAJERO';
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]],
      licenciaConducir: [''],
      fechaHabilitacion: ['']
    });

    this.route.queryParams.subscribe(params => {
      if (params['tipo'] === 'chofer') {
        this.cambiarRol('CHOFER');
      } else if (params['tipo'] === 'admin') {
        this.cambiarRol('ADMIN');
      } else {
        this.cambiarRol('PASAJERO');
      }
    });
  }

  cambiarRol(rol: 'PASAJERO' | 'CHOFER' | 'ADMIN'): void {
    this.mensajeError = null;
    this.mensajeExito = null;
    this.rolSeleccionado = rol;

    const licenciaCtrl = this.registroForm.get('licenciaConducir');
    const fechaCtrl = this.registroForm.get('fechaHabilitacion');

    if (rol === 'CHOFER') {
      licenciaCtrl?.setValidators([Validators.required]);
      fechaCtrl?.setValidators([Validators.required]);
    } else {
      licenciaCtrl?.clearValidators();
      fechaCtrl?.clearValidators();
      licenciaCtrl?.setValue('');
      fechaCtrl?.setValue('');
    }

    licenciaCtrl?.updateValueAndValidity();
    fechaCtrl?.updateValueAndValidity();
  }

  registrarUsuario(): void {
    this.mensajeError = null;

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const peticion$ = this.obtenerPeticionRegistro();
    const tipoUsuario = this.obtenerNombreRol();

    peticion$.subscribe({
      next: (res) => this.manejarExito(res, tipoUsuario),
      error: (err) => this.manejarError(err)
    });
  }

  obtenerNombreRol(): string {
    if (this.rolSeleccionado === 'CHOFER') {
      return 'Chofer';
    }

    if (this.rolSeleccionado === 'ADMIN') {
      return 'Admin';
    }

    return 'Pasajero';
  }

  private obtenerPeticionRegistro() {
    if (this.rolSeleccionado === 'PASAJERO') {
      return this.registroService.registrarPasajero(this.obtenerPayloadPasajero());
    }

    if (this.rolSeleccionado === 'CHOFER') {
      return this.registroService.registrarChofer(this.obtenerPayloadChofer());
    }

    return this.registroService.registrarAdmin(this.obtenerPayloadAdmin());
  }

  private obtenerPayloadPasajero(): RegistroPasajeroDTO {
    const { nombre, apellido, email, telefono, passwordHash } = this.registroForm.value;
    return { nombre, apellido, email, telefono, passwordHash };
  }

  private obtenerPayloadChofer(): RegistroChoferDTO {
    const { nombre, apellido, email, telefono, passwordHash, licenciaConducir, fechaHabilitacion } = this.registroForm.value;
    return { nombre, apellido, email, telefono, passwordHash, licenciaConducir, fechaHabilitacion };
  }

  private obtenerPayloadAdmin(): RegistroAdminDTO {
    const { nombre, apellido, email, telefono, passwordHash } = this.registroForm.value;
    return { nombre, apellido, email, telefono, passwordHash, estadoAdmin: 'ACTIVO' };
  }

  private manejarExito(res: any, tipoUsuario: string): void {
    console.log(`${tipoUsuario} registrado`, res);
    this.cargando = false;
    this.mensajeExito = `${tipoUsuario} registrado correctamente. Redirigiendo al login...`;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2500);
  }

  private manejarError(err: any): void {
    console.error(err);
    this.cargando = false;

    const mensajeBackend = err.error?.error || err.error?.msg || '';
    const errorClaveDuplicada = mensajeBackend.includes('llave duplicada') || mensajeBackend.includes('unique');

    if (errorClaveDuplicada) {
      this.mensajeError = this.rolSeleccionado === 'CHOFER'
        ? 'Este correo electronico o licencia ya se encuentra registrado/a.'
        : 'Este correo electronico ya se encuentra registrado.';
    } else {
      this.mensajeError = 'Ocurrio un error al registrar el usuario. Intente nuevamente.';
    }

    this.cdr.detectChanges();
  }
}
