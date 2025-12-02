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

    // ApexCharts configs
    lineOptions = signal<any>(null);
    radialOptions = signal<any>(null);
    treemapOptions = signal<any>(null);

    constructor(private dashboard: DashboardService) {}

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
                treemapRes
            ] = await Promise.all([
                this.dashboard.getTicketsCreatedToday().toPromise(),
                this.dashboard.getTicketsClosedToday().toPromise(),
                this.dashboard.getTicketsOpen().toPromise(),
                this.dashboard.getTicketsInProcess().toPromise(),
                this.dashboard.getResolvedPerMonth().toPromise(),
                this.dashboard.getMonthlyMTTR().toPromise(),
                this.dashboard.getLocationsTreemap().toPromise(),
            ]);

            // ===== KPI VALUES =====
            this.createdToday.set(createdTodayRes!.data);
            this.closedToday.set(closedTodayRes!.data);
            this.openTickets.set(openTicketsRes!.data);
            this.inProcess.set(inProcessRes!.data);

            // ===== LINE CHART (Resueltos por Mes) =====
            const resolvedMonth = resolvedPerMonthRes!.data;

            this.lineOptions.set({
                chart: { type: 'line', height: 300 },
                series: [
                    {
                        name: 'Resueltos', // visible string → stays Spanish
                        data: resolvedMonth.map(x => x.resueltos),
                    }
                ],
                xaxis: { categories: resolvedMonth.map(x => x.mes) }, // months stay in Spanish
                stroke: { curve: 'smooth' }
            });

            // ===== RADIAL CHART (MTTR Mensual) =====
            const mttr = mttrMonthlyRes!.data[0];

            this.radialOptions.set({
                chart: { type: 'radialBar', height: 300 },
                series: [parseFloat(mttr.mttr_horas)],
                labels: [mttr.mes], // month stays Spanish
                plotOptions: {
                    radialBar: {
                        hollow: { size: '60%' }
                    }
                }
            });

            // ===== TREEMAP CHART =====
            const treeData = treemapRes!.data;

            this.treemapOptions.set({
                chart: { type: 'treemap', height: 350 },
                series: treeData.map(group => ({
                    name: group.name, // category name stays Spanish
                    data: group.data.map(item => ({
                        x: item.ubicacion, // ubicacion stays Spanish
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
