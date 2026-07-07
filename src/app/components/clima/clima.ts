import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import { ClimaActual, ClimaService } from '../../services/clima.service';

type CiudadClima = {
  nombre: string;
  latitud: number;
  longitud: number;
};

@Component({
  selector: 'app-clima',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clima.html',
  styleUrl: './clima.scss'
})
export class ClimaComponent implements OnChanges, OnInit {
  @Input() ciudad = 'San Salvador de Jujuy';

  public clima?: ClimaActual;
  public cargando = false;
  public error = '';

  private readonly ciudades: Record<string, CiudadClima> = {
    'San Salvador de Jujuy': {
      nombre: 'San Salvador de Jujuy',
      latitud: -24.1858,
      longitud: -65.2995
    },
    Perico: {
      nombre: 'Perico',
      latitud: -24.3829,
      longitud: -65.1124
    }
  };

  constructor(private _climaService: ClimaService,
              private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarClima();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ciudad'] && !changes['ciudad'].firstChange) {
      this.cargarClima();
    }
  }

  get ciudadActual(): CiudadClima {
    return this.ciudades[this.ciudad] || this.ciudades['San Salvador de Jujuy'];
  }

  get temperatura(): number {
    return Math.round(this.clima?.current.temperature_2m ?? 0);
  }

  get sensacionTermica(): number {
    return Math.round(this.clima?.current.apparent_temperature ?? 0);
  }

  get probabilidadLluvia(): number {
    return this.clima?.daily.precipitation_probability_max?.[0] ?? 0;
  }

  get maxima(): number {
    return Math.round(this.clima?.daily.temperature_2m_max?.[0] ?? 0);
  }

  get minima(): number {
    return Math.round(this.clima?.daily.temperature_2m_min?.[0] ?? 0);
  }

  get descripcion(): string {
    const codigo = this.clima?.current.weather_code;

    if (codigo === 0) return 'Despejado';
    if ([1, 2, 3].includes(Number(codigo))) return 'Parcialmente nublado';
    if ([45, 48].includes(Number(codigo))) return 'Niebla';
    if ([51, 53, 55, 56, 57].includes(Number(codigo))) return 'Llovizna';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(Number(codigo))) return 'Lluvia';
    if ([71, 73, 75, 77, 85, 86].includes(Number(codigo))) return 'Nevada';
    if ([95, 96, 99].includes(Number(codigo))) return 'Tormenta';

    return 'Clima actual';
  }

  get iconoClima(): string {
    const codigo = this.clima?.current.weather_code;

    if (codigo === 0) return 'bi-sun-fill';
    if ([1, 2, 3].includes(Number(codigo))) return 'bi-cloud-sun-fill';
    if ([45, 48].includes(Number(codigo))) return 'bi-cloud-fog2-fill';
    if ([51, 53, 55, 56, 57].includes(Number(codigo))) return 'bi-cloud-drizzle-fill';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(Number(codigo))) return 'bi-cloud-rain-heavy-fill';
    if ([71, 73, 75, 77, 85, 86].includes(Number(codigo))) return 'bi-snow';
    if ([95, 96, 99].includes(Number(codigo))) return 'bi-cloud-lightning-rain-fill';

    return 'bi-cloud-fill';
  }

  cargarClima(): void {
    const ciudad = this.ciudadActual;

    this.cargando = true;
    this.error = '';

    this._climaService.obtenerClima(ciudad.latitud, ciudad.longitud).subscribe({
      next: (data) => {
        this.clima = data;
        this.cargando = false;
        this._changeDetectorRef.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudo cargar el clima.';
        this.cargando = false;
        console.error('Error al cargar clima:', err);
      }
    });
  }
}
