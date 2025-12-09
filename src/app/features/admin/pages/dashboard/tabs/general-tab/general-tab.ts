import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../../../../../core/services/dashboard.service';

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

    // Loading state
    loading = signal(true);

    // KPI signals
    createdToday = signal<number | null>(null);
    closedToday = signal<number | null>(null);
    openTickets = signal<number | null>(null);
    inProcess = signal<number | null>(null);

    // SLA signals
    slaGlobal = signal<number | null>(null);
    slaPrioridades = signal<any[]>([]);

    // ApexCharts configs
    lineOptions = signal<any>(null);
    mttrLineOptions = signal<any>(null);
    treemapOptions = signal<any>(null);

    constructor(private dashboard: DashboardService) { }

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        this.loading.set(true);

        try {
            const [
                createdTodayRes,
                closedTodayRes,
                openTicketsRes,
                inProcessRes,
                resolvedPerMonthRes,
                mttrMonthlyRes,
                treemapRes,
                slaRes
            ] = await Promise.all([
                this.dashboard.getTicketsCreatedToday().toPromise(),
                this.dashboard.getTicketsClosedToday().toPromise(),
                this.dashboard.getTicketsOpen().toPromise(),
                this.dashboard.getTicketsInProcess().toPromise(),
                this.dashboard.getResolvedPerMonth().toPromise(),
                this.dashboard.getMonthlyMTTR().toPromise(),
                this.dashboard.getLocationsTreemap().toPromise(),
                this.dashboard.getSLAData().toPromise(),
            ]);

            // ===== KPI VALUES =====
            this.createdToday.set(createdTodayRes!.data);
            this.closedToday.set(closedTodayRes!.data);
            this.openTickets.set(openTicketsRes!.data);
            this.inProcess.set(inProcessRes!.data);

            // ===== SLA VALUES =====
            this.slaGlobal.set(slaRes!.data.cumplimiento_global);
            this.slaPrioridades.set(
                slaRes!.data.prioridades.map((p: any) => ({
                    ...p,
                    estado: p.mttr_horas <= p.meta ? 'Cumplido' : 'Incumplido'
                }))
            );


            // ===== LINE CHART (Resueltos por Mes) =====
            const resolvedMonth = resolvedPerMonthRes!.data;

            this.lineOptions.set({
                chart: { type: 'line', height: 300 },
                series: [
                    {
                        name: 'Resueltos',
                        data: resolvedMonth.map(x => x.resueltos),
                    }
                ],
                xaxis: { categories: resolvedMonth.map(x => x.mes) },
                stroke: { curve: 'smooth' }
            });

            // ===== LINE CHART (MTTR Mensual) =====
            const mttrData = mttrMonthlyRes!.data;

            this.mttrLineOptions.set({
                chart: { type: 'line', height: 300, toolbar: { show: false } },
                series: [
                    {
                        name: 'MTTR (hrs)',
                        data: mttrData.map(x => parseFloat(x.mttr_horas))
                    }
                ],
                xaxis: {
                    categories: mttrData.map(x => x.mes)
                },
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 4 },
                tooltip: {
                    y: {
                        formatter: (val: number) => `${val} horas`
                    }
                }
            });

            // ===== TREEMAP CHART =====
            const treeData = treemapRes!.data;

            this.treemapOptions.set({
                chart: { type: 'treemap', height: 350 },
                series: treeData.map(group => ({
                    name: group.name,
                    data: group.data.map(item => ({
                        x: item.ubicacion,
                        y: item.tickets
                    }))
                }))
            });

        } catch (err) {
            console.error('Dashboard loading error:', err);
        }

        this.loading.set(false);
    }
}
