import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.html',
})
export class AdminDashboardComponent implements OnInit {

    currentTab = signal('general');

    loading = signal(false);

    // Datos Mockup (Estructura preparada para la API)
    stats = signal<any>({
        // KPI Generales (SQL Diario)
        creados_hoy: 0,
        cerrados_hoy: 0,
        en_proceso: 0,
        abiertos_totales: 0,
        sla_global: 0,

        // Gráfico Semanal
        semana: [],

        // Por Unidad
        unidades: [],

        // Equipo
        equipo: []
    });

    constructor() { }

    ngOnInit() {
        this.loadDashboardData();
    }

    get fechaActual(): Date {
        return new Date();
    }

    loadDashboardData() {
        this.loading.set(true);

        // SIMULACIÓN DE LLAMADA A API
        setTimeout(() => {
            this.stats.set({
                creados_hoy: 42,
                cerrados_hoy: 38,
                en_proceso: 15,
                abiertos_totales: 124,
                sla_global: 92,

                semana: [
                    { dia: 'Lun', total: 45 },
                    { dia: 'Mar', total: 52 },
                    { dia: 'Mie', total: 38 },
                    { dia: 'Jue', total: 42 },
                    { dia: 'Vie', total: 60 },
                    { dia: 'Sab', total: 15 },
                    { dia: 'Dom', total: 8 }
                ],

                unidades: [
                    { nombre: 'Soporte Técnico', abiertos: 58, en_proceso: 19, cerrados_hoy: 25, total_miembros: 8, mttr: 2.5 },
                    { nombre: 'Infraestructura', abiertos: 21, en_proceso: 8, cerrados_hoy: 10, total_miembros: 5, mttr: 4.1 },
                    { nombre: 'Desarrollo', abiertos: 34, en_proceso: 12, cerrados_hoy: 3, total_miembros: 6, mttr: 18.5 }
                ],

                equipo: [
                    { nombre: 'Lucas Fernández', unidad: 'Soporte', resueltos: 145, asignados: 12, eficacia: 98 },
                    { nombre: 'Ana Morales', unidad: 'Infraestructura', resueltos: 98, asignados: 5, eficacia: 95 },
                    { nombre: 'Javier Soto', unidad: 'Desarrollo', resueltos: 42, asignados: 8, eficacia: 88 },
                    { nombre: 'Marta Reyes', unidad: 'Soporte', resueltos: 110, asignados: 15, eficacia: 92 },
                    { nombre: 'Carlos Ruiz', unidad: 'Soporte', resueltos: 85, asignados: 3, eficacia: 90 }
                ]
            });

            this.loading.set(false);
        }, 1000); // Simula 1 segundo de carga de red
    }

    refreshData() {
        this.loadDashboardData();
    }

    // Helpers de Estilo
    getTabClass(tabName: string): string {
        const isActive = this.currentTab() === tabName;
        return isActive
            ? 'border-[#002777] text-[#002777]'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';
    }

    getIconClass(tabName: string): string {
        return this.currentTab() === tabName ? 'text-[#62CEEA]' : 'text-slate-400 group-hover:text-slate-500';
    }

    calcEficiencia(): number {
        const s = this.stats();
        if (s.creados_hoy === 0) return 100;
        return Math.round((s.cerrados_hoy / s.creados_hoy) * 100);
    }
}