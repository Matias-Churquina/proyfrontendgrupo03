import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { ClimaActual, ClimaService } from '../../services/clima.service';

@Component({
  selector: 'app-clima-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clima-widget.html',
  styleUrl: './clima-widget.css'
})
export class ClimaWidget implements OnChanges {
  @Input() titulo = 'Clima actual';
  @Input() ubicacionNombre = 'Ubicacion';
  @Input() latitud?: number;
  @Input() longitud?: number;

  clima?: ClimaActual;
  cargando = false;
  error = '';

  constructor(
    private climaService: ClimaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    if (this.latitud !== undefined && this.longitud !== undefined) {
      this.cargarClima();
    }
  }

  cargarClima(): void {
    if (this.latitud === undefined || this.longitud === undefined) {
      return;
    }

    this.cargando = true;
    this.error = '';

    this.climaService.obtenerClima(this.latitud, this.longitud).subscribe({
      next: (data) => {
        this.clima = data;
        this.cargando = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = 'No se pudo obtener el clima.';
        this.cargando = false;

        this.cdr.detectChanges();
      }
    });
  }

  get recomendacion(): string {
    if (!this.clima) {
      return '';
    }

    const lluvia = this.clima.current.rain > 0 || this.clima.current.precipitation > 0;
    const viento = this.clima.current.wind_speed_10m >= 35;

    if (lluvia && viento) {
      return 'Precaucion por lluvia y viento.';
    }

    if (lluvia) {
      return 'Precaucion por lluvia.';
    }

    if (viento) {
      return 'Precaucion por viento.';
    }

    return 'Buenas condiciones para viajar.';
  }

  get claseRecomendacion(): string {
    if (!this.clima) {
      return 'alert-secondary';
    }

    const lluvia = this.clima.current.rain > 0 || this.clima.current.precipitation > 0;
    const viento = this.clima.current.wind_speed_10m >= 35;

    return lluvia || viento ? 'alert-warning' : 'alert-success';
  }

  get iconoClima(): string {
    if (!this.clima) {
      return 'bi-cloud';
    }

    const codigo = this.clima.current.weather_code;

    if (codigo === 0) {
      return 'bi-sun-fill';
    }

    if ([1, 2].includes(codigo)) {
      return 'bi-cloud-sun-fill';
    }

    if (codigo === 3) {
      return 'bi-cloud-fill';
    }

    if ([45, 48].includes(codigo)) {
      return 'bi-cloud-fog2-fill';
    }

    if ((codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) {
      return 'bi-cloud-rain-heavy-fill';
    }

    if (codigo >= 71 && codigo <= 77) {
      return 'bi-cloud-snow-fill';
    }

    if (codigo >= 95 && codigo <= 99) {
      return 'bi-cloud-lightning-rain-fill';
    }

    return 'bi-cloud-fill';
  }

  get descripcionClima(): string {
    if (!this.clima) {
      return 'Clima';
    }

    const codigo = this.clima.current.weather_code;

    if (codigo === 0) {
      return 'Soleado';
    }

    if ([1, 2].includes(codigo)) {
      return 'Parcialmente nublado';
    }

    if (codigo === 3) {
      return 'Nublado';
    }

    if ([45, 48].includes(codigo)) {
      return 'Neblina';
    }

    if ((codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) {
      return 'Lluvia';
    }

    if (codigo >= 71 && codigo <= 77) {
      return 'Nieve';
    }

    if (codigo >= 95 && codigo <= 99) {
      return 'Tormenta';
    }

    return 'Clima variable';
  }

  get claseIconoClima(): string {
    if (!this.clima) {
      return 'clima-icono-nube';
    }

    const codigo = this.clima.current.weather_code;

    if (codigo === 0 || [1, 2].includes(codigo)) {
      return 'clima-icono-sol';
    }

    if ((codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) {
      return 'clima-icono-lluvia';
    }

    if (codigo >= 95 && codigo <= 99) {
      return 'clima-icono-tormenta';
    }

    return 'clima-icono-nube';
  }
}
