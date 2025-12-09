import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../../../core/services/dashboard.service';

export interface TecnicoRendimiento {
    usuario_id: number;
    nombre_completo: string;
    unidad: string;
    tickets_resueltos: number;

    // Cambiamos el nombre para que tenga sentido semántico
    tickets_asignados_mes: number;

    eficacia?: number;
}

@Component({
    selector: 'app-equipo-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './equipo-tab.html',
})
export class EquipoTabComponent implements OnInit {

    loading = signal(false);
    activeTab = signal<string>('Soporte');
    allTecnicos = signal<TecnicoRendimiento[]>([]);

    // --- NUEVO: Filtros ---
    selectedYear = signal<number>(new Date().getFullYear());
    selectedMonth = signal<number>(new Date().getMonth() + 1);
    availableYears = signal<number[]>([]);

    // Constante de meses
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

    tabs = ['Soporte', 'Desarrollo', 'Infraestructura'];

    // Datos filtrados por Tab + Cálculo de Eficacia
    filteredTecnicos = computed(() => {
        const rawData = this.allTecnicos();
        const tab = this.activeTab().toLowerCase();

        if (!Array.isArray(rawData)) return [];

        return rawData
            .filter(t => t.unidad && t.unidad.toLowerCase() === tab)
            .map(t => {
                // Nueva Lógica de Eficacia: (Resueltos / Asignados en el mes)
                const asignados = Number(t.tickets_asignados_mes) || 0;
                const resueltos = Number(t.tickets_resueltos) || 0;

                // Si le asignaron 0 tickets, pero resolvió algo (pendientes viejos), 
                // técnicamente su eficacia es infinita, pero lo limitaremos visualmente o pondremos 100%
                let eficacia = 0;

                if (asignados > 0) {
                    eficacia = (resueltos / asignados) * 100;
                } else if (resueltos > 0) {
                    // Caso especial: No le asignaron nada nuevo, pero resolvió pendientes viejos.
                    eficacia = 100;
                }

                return {
                    ...t,
                    eficacia: Math.round(eficacia)
                };
            });
    });

    constructor(private dashboard: DashboardService) { }

    async ngOnInit() {
        // 1. Cargar años disponibles primero
        await this.loadYears();
        // 2. Cargar datos con los filtros por defecto
        this.loadData();
    }

    async loadYears() {
        try {
            const res: any = await this.dashboard.getAvailableYears().toPromise();
            // Ajusta según cómo responda tu API (si es array directo o objeto { data: [] })
            const years = Array.isArray(res) ? res : (res.data || [new Date().getFullYear()]);
            this.availableYears.set(years);
        } catch (error) {
            console.error('Error cargando años:', error);
            this.availableYears.set([new Date().getFullYear()]); // Fallback
        }
    }

    async loadData() {
        this.loading.set(true);
        const year = this.selectedYear();
        const month = this.selectedMonth();

        try {
            const response: any = await this.dashboard.getRendimientoEquipo(year, month).toPromise();

            let dataLimpia: TecnicoRendimiento[] = [];
            if (Array.isArray(response)) {
                dataLimpia = response;
            } else if (response && Array.isArray(response.data)) {
                dataLimpia = response.data;
            }

            this.allTecnicos.set(dataLimpia);

        } catch (error) {
            console.error('Error cargando equipo:', error);
            this.allTecnicos.set([]);
        }
        this.loading.set(false);
    }

    setActiveTab(tab: string) {
        this.activeTab.set(tab);
    }

    // --- Eventos de Cambio de Filtro ---
    onYearChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.selectedYear.set(Number(val));
        this.loadData();
    }

    onMonthChange(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.selectedMonth.set(Number(val));
        this.loadData();
    }
}