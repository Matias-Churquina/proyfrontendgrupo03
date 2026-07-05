import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PuntoMapa {
  latitud: number;
  longitud: number;
  precision?: number;
  titulo?: string;
  detalle?: string;
}

interface PuntoGoogleMaps extends PuntoMapa {
  url: SafeResourceUrl;
  link: string;
}

@Component({
  selector: 'app-mapa-ubicacion',
  imports: [],
  templateUrl: './mapa-ubicacion.html',
  styleUrl: './mapa-ubicacion.css',
})
export class MapaUbicacion {
  @Input() titulo = 'Ubicacion';
  @Input() latitud?: number;
  @Input() longitud?: number;
  @Input() precision?: number;
  @Input() ubicaciones: PuntoMapa[] = [];
  @Input() set ubicacionesChoferes(value: PuntoMapa[] | null | undefined) {
    this.ubicaciones = value || [];
  }

  constructor(private sanitizer: DomSanitizer) {}

  get puntos(): PuntoMapa[] {
    if (this.ubicaciones.length > 0) {
      return this.ubicaciones;
    }

    if (this.latitud !== undefined && this.longitud !== undefined) {
      return [
        {
          latitud: this.latitud,
          longitud: this.longitud,
          precision: this.precision,
          titulo: this.titulo,
        },
      ];
    }

    return [];
  }

  get tieneUbicacion(): boolean {
    return this.puntos.length > 0;
  }

  get puntosGoogleMaps(): PuntoGoogleMaps[] {
    return this.puntos.map((punto) => {
      const coordenadas = `${punto.latitud},${punto.longitud}`;
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(coordenadas)}&z=15&hl=es&output=embed`;

      return {
        ...punto,
        url: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordenadas)}`,
      };
    });
  }
}
