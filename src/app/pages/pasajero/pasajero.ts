import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClimaWidget } from '../../components/clima-widget/clima-widget';
import { MapaUbicacion, PuntoMapa } from '../../components/mapa-ubicacion/mapa-ubicacion';
import { ChoferService } from '../../services/chofer.service';
import { SesionService, UsuarioSesion } from '../../services/sesion.service';


@Component({
  selector: 'app-pasajero',
  imports: [MapaUbicacion, ClimaWidget],
  templateUrl: './pasajero.html',
  styleUrl: './pasajero.css',
})
export class PasajeroPage implements AfterViewInit {
  usuario: UsuarioSesion | null = null;

  readonly climaPerico = {
    nombre: 'Perico',
    latitud: -24.3833,
    longitud: -65.1167,
  };

  readonly climaSanSalvador = {
    nombre: 'San Salvador de Jujuy',
    latitud: -24.1858,
    longitud: -65.2995,
  };

  ubicacionesChoferes: PuntoMapa[] = [];
  mostrarMapaChoferes = false;
  cargandoUbicacion = false;
  mensajeUbicacion = '';
  errorUbicacion = '';
  latitud: number | undefined;
  longitud: number | undefined;
  precision: number | undefined;

  constructor(
    private sesionService: SesionService,
    private choferService: ChoferService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.usuario = this.sesionService.obtenerUsuario();

    if (!this.usuario || this.usuario.rol !== 'PASAJERO') {
      this.router.navigate(['/login']);
      return;
    }

  }

  ngAfterViewInit(): void {
    setTimeout(() => this.cdr.detectChanges());
  }

  cerrarSesion(): void {
    this.sesionService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  irAViajes(): void {
    this.router.navigate(['/viajes']);
  }

  irAReservas(): void {
    this.router.navigate(['/reservas']);
  }

  mostrarMapa(): void {
    this.mostrarMapaChoferes = true;
    this.cargarChoferesConUbicacion();
  }

  cargarChoferesConUbicacion(): void {
    this.mostrarMapaChoferes = true;
    this.mensajeUbicacion = '';
    this.errorUbicacion = '';
    this.cargandoUbicacion = true;

    this.choferService.obtenerChoferes().subscribe({
      next: (choferes) => {
        this.cargandoUbicacion = false;

        this.ubicacionesChoferes = choferes
          .filter((chofer) => chofer.latitud !== null && chofer.latitud !== undefined && chofer.longitud !== null && chofer.longitud !== undefined)
          .map((chofer) => {
            console.log(`Chofer ${chofer.idChofer}: latitud=${chofer.latitud}, longitud=${chofer.longitud}, precision=${chofer.precision}`);
            return {
              latitud: Number(chofer.latitud),
              longitud: Number(chofer.longitud),
              precision: chofer.precision !== null && chofer.precision !== undefined ? Number(chofer.precision) : undefined,
              titulo: `Chofer ${chofer.idChofer}`,
              detalle: chofer.usuario ? `${chofer.usuario.nombre} ${chofer.usuario.apellido}` : chofer.estadoChofer,
            };
          });

        if (this.ubicacionesChoferes.length === 0) {
          this.errorUbicacion = 'Todavia no hay choferes compartiendo ubicacion.';
          this.cdr.detectChanges();
          return;
        }

        this.mensajeUbicacion = `Choferes en mapa: ${this.ubicacionesChoferes.length}`;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.cargandoUbicacion = false;
        this.errorUbicacion = error.error?.msg || 'No se pudieron obtener las ubicaciones de los choferes.';
        this.cdr.detectChanges();
      },
    });
  }
}
