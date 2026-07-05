import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DashboardData, DashboardGrupo, DashboardService } from '../../services/dashboard.service';
import { SesionService } from '../../services/sesion.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  dashboard?: DashboardData;
  cargando = false;
  error = '';
  filtro = '';
  paginaActual = 1;
  tamanioPagina = 5;

  barChartType: 'bar' = 'bar';
  pieChartType: 'pie' = 'pie';
  lineChartType: 'line' = 'line';

  viajesPorEstadoData: ChartData<'bar'> = { labels: [], datasets: [] };
  reservasPorEstadoData: ChartData<'pie'> = { labels: [], datasets: [] };
  reservasPorFechaData: ChartData<'line'> = { labels: [], datasets: [] };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  private readonly colores = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14'];

  constructor(
    private dashboardService: DashboardService,
    private sesionService: SesionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.sesionService.obtenerUsuario();

    if (!usuario || usuario.rol !== 'ADMIN') {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService.obtenerDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.configurarGraficos();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);
        this.error = error.error?.msg || 'No se pudo obtener el dashboard.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });

  }

  get tarjetasResumen(): { titulo: string; valor: number; clase: string }[] {
    if (!this.dashboard) {
      return [];
    }

    return [
      { titulo: 'Usuarios', valor: this.dashboard.totales.usuarios, clase: 'bg-primary' },
      { titulo: 'Pasajeros', valor: this.dashboard.totales.pasajeros, clase: 'bg-success' },
      { titulo: 'Choferes', valor: this.dashboard.totales.choferes, clase: 'bg-info' },
      { titulo: 'Autos', valor: this.dashboard.totales.autos, clase: 'bg-warning' },
      { titulo: 'Viajes', valor: this.dashboard.totales.viajes, clase: 'bg-secondary' },
      { titulo: 'Reservas', valor: this.dashboard.totales.reservas, clase: 'bg-danger' },
    ];
  }

  get reservasFiltradas(): any[] {
    const reservas = this.dashboard?.ultimasReservas || [];
    const texto = this.filtro.trim().toLowerCase();

    if (!texto) {
      return reservas;
    }

    return reservas.filter((reserva) => this.textoReserva(reserva).includes(texto));
  }

  get reservasPaginadas(): any[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.reservasFiltradas.slice(inicio, inicio + this.tamanioPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.reservasFiltradas.length / this.tamanioPagina));
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
  }

  textoReserva(reserva: any): string {
    return [
      reserva.idReserva,
      this.nombrePasajero(reserva),
      this.nombreChofer(reserva),
      reserva.viaje?.origen,
      reserva.viaje?.destino,
      reserva.estadoReserva,
      reserva.estadoPago,
      reserva.importeTotal,
    ].join(' ').toLowerCase();
  }

  nombrePasajero(reserva: any): string {
    const usuario = reserva.pasajero?.usuario;
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '-';
  }

  nombreChofer(reserva: any): string {
    const usuario = reserva.viaje?.chofer?.usuario;
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '-';
  }

  exportarPDF(): void {
    if (!this.dashboard) {
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Dashboard Administrativo Perico-Perico', 14, 16);

    autoTable(doc, {
      startY: 24,
      head: [['Metrica', 'Total']],
      body: this.tarjetasResumen.map((item) => [item.titulo, item.valor]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['ID', 'Pasajero', 'Chofer', 'Origen', 'Destino', 'Fecha', 'Reserva', 'Pago', 'Importe']],
      body: this.dashboard.ultimasReservas.map((reserva) => this.filaReserva(reserva)),
      styles: { fontSize: 8 },
    });

    doc.save('dashboard-perico.pdf');
  }

  exportarExcel(): void {
    if (!this.dashboard) {
      return;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(this.tarjetasResumen), 'Totales');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(this.dashboard.viajesPorEstado), 'Viajes por estado');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(this.dashboard.reservasPorEstado), 'Reservas por estado');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(this.dashboard.ultimasReservas.map((reserva) => ({
      idReserva: reserva.idReserva,
      pasajero: this.nombrePasajero(reserva),
      chofer: this.nombreChofer(reserva),
      origen: reserva.viaje?.origen || '-',
      destino: reserva.viaje?.destino || '-',
      fecha: reserva.createdAt || '-',
      estadoReserva: reserva.estadoReserva,
      estadoPago: reserva.estadoPago,
      importeTotal: reserva.importeTotal,
    }))), 'Ultimas reservas');

    XLSX.writeFile(workbook, 'dashboard-perico.xlsx');
  }

  cerrarSesion(): void {
    this.sesionService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  private configurarGraficos(): void {
    if (!this.dashboard) {
      return;
    }

    this.viajesPorEstadoData = this.crearBarData(this.dashboard.viajesPorEstado, 'Viajes');
    this.reservasPorEstadoData = {
      labels: this.dashboard.reservasPorEstado.map((item) => item.estado),
      datasets: [
        {
          data: this.dashboard.reservasPorEstado.map((item) => item.cantidad),
          backgroundColor: this.colores,
        },
      ],
    };
    this.reservasPorFechaData = {
      labels: this.dashboard.reservasPorFecha.map((item) => item.fecha),
      datasets: [
        {
          label: 'Reservas',
          data: this.dashboard.reservasPorFecha.map((item) => item.cantidad),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.18)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }

  private crearBarData(items: DashboardGrupo[], label: string): ChartData<'bar'> {
    return {
      labels: items.map((item) => item.estado),
      datasets: [
        {
          label,
          data: items.map((item) => item.cantidad),
          backgroundColor: '#0d6efd',
        },
      ],
    };
  }

  private filaReserva(reserva: any): any[] {
    return [
      reserva.idReserva,
      this.nombrePasajero(reserva),
      this.nombreChofer(reserva),
      reserva.viaje?.origen || '-',
      reserva.viaje?.destino || '-',
      reserva.createdAt || '-',
      reserva.estadoReserva,
      reserva.estadoPago,
      reserva.importeTotal,
    ];
  }
}
