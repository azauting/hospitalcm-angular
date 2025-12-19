import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GeneralTabComponent } from './general-tab';
import { DashboardService } from '../../../../../../core/services/dashboard.service';

const dashboardStub = {
    getTicketsCreatedToday: () => of({ data: 10 }),
    getTicketsClosedToday: () => of({ data: 3 }),
    getTicketsOpen: () => of({ data: 7 }),
    getTicketsInProcess: () => of({ data: 2 }),
    getResolvedPerMonth: () => of({ data: [{ mes: 'Ene', resueltos: 5 }] }),
    getMonthlyMTTR: () => of({ data: [{ mes: 'Ene', mttr_horas: '4.5' }] }),
    getLocationsTreemap: () => of({ data: [{ name: 'A', data: [{ ubicacion: 'X', tickets: 2 }] }] }),
    getSLAData: () => of({ data: { cumplimiento_global: 95, prioridades: [{ prioridad: 'Alta', mttr_horas: 2, meta: 4 }] } }),
};

describe('GeneralTabComponent', () => {
    let fixture: ComponentFixture<GeneralTabComponent>;
    let component: GeneralTabComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GeneralTabComponent],
            providers: [{ provide: DashboardService, useValue: dashboardStub }],
        }).compileComponents();

        fixture = TestBed.createComponent(GeneralTabComponent);
        component = fixture.componentInstance;
    });

    it('carga y muestra las métricas numéricas', async () => {
        await component.loadData();
        expect(component.createdToday()).toBe(10);
        expect(component.closedToday()).toBe(3);
        expect(component.openTickets()).toBe(7);
        expect(component.inProcess()).toBe(2);
        expect(component.loading()).toBe(false);
    });

    it('construye opciones de gráficas con los datos simulados', async () => {
        await component.loadData();
        fixture.detectChanges();
        expect(component.lineOptions()?.series[0].data).toEqual([5]);
        expect(component.mttrLineOptions()?.series[0].data).toEqual([4.5]);
        expect(component.treemapOptions()?.series[0].data[0].y).toBe(2);
        expect(component.slaGlobal()).toBe(95);
        expect(component.slaPrioridades()[0].estado).toBe('Cumplido');
    });
});
