import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../../../../../core/services/dashboard/dashboard.service';

@Component({
    selector: 'app-general-tab',
    standalone: true,
    imports: [
        CommonModule,
        NgApexchartsModule
    ],
    templateUrl: './general-tab.html',
})
export class GeneralTabComponent implements OnInit {

    loading = signal(true);

    // KPI signals
    creadosHoy = signal<number | null>(null);
    cerradosHoy = signal<number | null>(null);
    abiertos = signal<number | null>(null);
    enProceso = signal<number | null>(null);

    // ApexCharts configs
    lineOptions = signal<any>(null);
    radialOptions = signal<any>(null);
    treemapOptions = signal<any>(null);

    constructor(private dashboard: DashboardService) { }

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        this.loading.set(true);

        try {
            const [
                creadosHoyRes,
                cerradosHoyRes,
                abiertosRes,
                enProcesoRes,
                resueltosMesRes,
                mttrMensualRes,
                treemapRes
            ] = await Promise.all([
                this.dashboard.getTicketsCreadosHoy().toPromise(),
                this.dashboard.getTicketsCerradosHoy().toPromise(),
                this.dashboard.getTicketsAbiertos().toPromise(),
                this.dashboard.getTicketsEnProceso().toPromise(),
                this.dashboard.getResueltosMes().toPromise(),
                this.dashboard.getMTTRMensual().toPromise(),
                this.dashboard.getUbicacionesTreemap().toPromise(),
            ]);

            // ===== KPI values =====
            this.creadosHoy.set(creadosHoyRes!.data);
            this.cerradosHoy.set(cerradosHoyRes!.data);
            this.abiertos.set(abiertosRes!.data);
            this.enProceso.set(enProcesoRes!.data);

            // ===== LINE CHART (Resueltos por Mes) =====
            const rm = resueltosMesRes!.data;
            this.lineOptions.set({
                chart: { type: 'line', height: 300 },
                series: [
                    {
                        name: 'Resueltos',
                        data: rm.map(x => x.resueltos)
                    }
                ],
                xaxis: { categories: rm.map(x => x.mes) },
                stroke: { curve: 'smooth' }
            });

            // ===== RADIAL CHART (MTTR Mensual) =====
            const mttr = mttrMensualRes!.data[0];
            this.radialOptions.set({
                chart: { type: 'radialBar', height: 300 },
                series: [parseFloat(mttr.mttr_horas)],
                labels: [mttr.mes],
                plotOptions: {
                    radialBar: {
                        hollow: { size: '60%' }
                    }
                }
            });

            // ===== TREEMAP =====
            const tree = treemapRes!.data;
            this.treemapOptions.set({
                chart: { type: 'treemap', height: 350 },
                series: tree.map(group => ({
                    name: group.name,
                    data: group.data.map(item => ({
                        x: item.ubicacion,
                        y: item.tickets
                    }))
                }))
            });

        } catch (err) {
            console.error('Error al cargar dashboard:', err);
        }

        this.loading.set(false);
    }
}
