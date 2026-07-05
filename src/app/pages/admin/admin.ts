import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistroAdminDTO, RegistroService } from '../../services/registro-service';
import { SesionService, UsuarioSesion } from '../../services/sesion.service';
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, ReactiveFormsModule, AdminDashboard],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage {
  @ViewChild(AdminDashboard) dashboard?: AdminDashboard;

  private fb = inject(FormBuilder);
  private registroService = inject(RegistroService);
  private sesionService = inject(SesionService);
  private router = inject(Router);

  usuario: UsuarioSesion | null = this.sesionService.obtenerUsuario();
  adminForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    passwordHash: ['', [Validators.required, Validators.minLength(6)]],
    estadoAdmin: ['ACTIVO', Validators.required],
  });

  cargandoRegistro = false;
  mensajeExito = '';
  mensajeError = '';

  constructor() {
    if (!this.usuario || this.usuario.rol !== 'ADMIN') {
      this.router.navigate(['/login']);
    }
  }

  registrarAdmin(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.cargandoRegistro = true;
    const payload: RegistroAdminDTO = this.adminForm.value;

    this.registroService.registrarAdmin(payload).subscribe({
      next: () => {
        this.cargandoRegistro = false;
        this.mensajeExito = 'Admin registrado correctamente.';
        this.adminForm.reset({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          passwordHash: '',
          estadoAdmin: 'ACTIVO',
        });
        this.dashboard?.cargarDashboard();
      },
      error: (error) => {
        console.error(error);
        this.cargandoRegistro = false;
        const mensajeBackend = error.error?.error || error.error?.msg || '';
        this.mensajeError = mensajeBackend.includes('unique') || mensajeBackend.includes('duplicada')
          ? 'El email ya se encuentra registrado.'
          : 'No se pudo registrar el admin.';
      },
    });
  }
}
