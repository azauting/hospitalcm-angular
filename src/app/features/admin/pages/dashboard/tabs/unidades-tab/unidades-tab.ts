import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// Asegúrate de importar lastValueFrom si prefieres no usar toPromise (que está deprecado), 
// pero mantendré toPromise para seguir tu estilo actual.
import { DashboardService } from '../../../../../../core/services/dashboard.service';

interface UnidadMes {
    unidad_id: number;
    unidad: string;
    miembros: number;
    pendientes: number;
    en_proceso: number;
    cerrados: number;
    mttr_mensual: number;
}

interface UnidadAnualResumen {
    unidad_id: number;
    unidad: string;
    totalCerrados: number;
    mttrPromedioAnual: number;
}

@Component({
    selector: 'app-unidades-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './unidades-tab.html',
})
export class UnidadesTabComponent implements OnInit {

    loading = signal(false);

    // Filtros
    // Inicializamos con el año actual por defecto, pero esto cambiará al cargar los años
    selectedYear = signal<number>(new Date().getFullYear());
    selectedMonth = signal<number>(new Date().getMonth() + 1);

    // Datos para los selectores
    availableYears = signal<number[]>([]); // <--- NUEVO: Lista dinámica de años
    
    // Datos del dashboard
    unidadesMes = signal<UnidadMes[]>([]);
    unidadesAnual = signal<UnidadAnualResumen[]>([]);

    readonly meses = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' },
    ];

    constructor(private dashboard: DashboardService) { }

    async ngOnInit() {
        // 1. Primero cargamos los años disponibles
        await this.loadAvailableYears();
        // 2. Luego cargamos la data con el año seleccionado (que puede haber cambiado tras cargar los años)
        this.loadData();
    }

    async loadAvailableYears() {
        try {
            const response = await this.dashboard.getAvailableYears().toPromise();
            
            // Asumimos que response.data es un array de números ej: [2023, 2024, 2025]
            const years: number[] = response?.data || [new Date().getFullYear()]; 

            // Ordenamos descendente (el más reciente primero)
            years.sort((a, b) => b - a);
            
            this.availableYears.set(years);

            // Seleccionamos por defecto el año más reciente disponible
            if (years.length > 0) {
                this.selectedYear.set(years[0]);
            }

        } catch (error) {
            console.error('Error cargando años disponibles', error);
            // Fallback en caso de error: poner el año actual
            this.availableYears.set([new Date().getFullYear()]);
        }
    }

    async loadData() {
        this.loading.set(true);

        const year = this.selectedYear();
        const month = this.selectedMonth();

        try {
            const [mesRes, anualRes] = await Promise.all([
                this.dashboard.getUnidadesMes(year, month).toPromise(),
                this.dashboard.getUnidadesAnual(year).toPromise(),
            ]);

            const unidadesMesData: UnidadMes[] = mesRes!.data;
            this.unidadesMes.set(unidadesMesData);

            // ---- Procesar vista anual (resumen por unidad) ----
            const cerradosRaw = anualRes!.data.cerrados as any[];
            const mttrRaw = anualRes!.data.mttr as any[];

            const resumen: UnidadAnualResumen[] = unidadesMesData.map((u) => {
                const cerradosUnidad = cerradosRaw.filter(c => c.unidad_id === u.unidad_id);
                const mttrUnidad = mttrRaw.filter(m => m.unidad_id === u.unidad_id);

                const totalCerrados = cerradosUnidad.reduce((acc, c) => acc + (c.cerrados ?? 0), 0);

                const mttrPromedioAnual =
                    mttrUnidad.length > 0
                        ? mttrUnidad.reduce((acc, m) => acc + (m.mttr_mensual ?? 0), 0) / mttrUnidad.length
                        : 0;

                return {
                    unidad_id: u.unidad_id,
                    unidad: u.unidad,
                    totalCerrados,
                    mttrPromedioAnual: Number(mttrPromedioAnual.toFixed(2)),
                };
            });

            this.unidadesAnual.set(resumen);

        } catch (error) {
            console.error('Error cargando datos de unidades:', error);
        }

        this.loading.set(false);
    }

    onMonthChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedMonth.set(Number(value));
        this.loadData();
    }

    onYearChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedYear.set(Number(value));
        this.loadData();
    }
}