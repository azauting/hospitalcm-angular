import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AdminDashboardComponent } from './dashboard';

describe('AdminDashboardComponent', () => {
    let fixture: ComponentFixture<AdminDashboardComponent>;
    let component: AdminDashboardComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent],
        })
            .overrideComponent(AdminDashboardComponent, {
                set: {
                    // Evita montar tabs/hijos y sus dependencias
                    imports: [],
                    template: '<div></div>',
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(AdminDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('crea el componente y deja la pestaña general activa', () => {
        expect(component).toBeTruthy();
        expect(component.currentTab()).toBe('general');
        expect(component.getTabClass('general')).toContain('border-[#002777]');
    });

    it('al refrescar activa loading y vuelve a false tras el delay', () => {
        vi.useFakeTimers();
        component.refreshData();
        expect(component.loading()).toBe(true);
        vi.runAllTimers();
        expect(component.loading()).toBe(false);
        vi.useRealTimers();
    });
});
