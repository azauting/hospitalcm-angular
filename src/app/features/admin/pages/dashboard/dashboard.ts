import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralTabComponent } from './tabs/general-tab/general-tab';
import { UnidadesTabComponent } from './tabs/unidades-tab/unidades-tab';
import { EquipoTabComponent } from './tabs/equipo-tab/equipo-tab';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        GeneralTabComponent,
        UnidadesTabComponent,
        EquipoTabComponent
    ],
    templateUrl: './dashboard.html',
})
export class AdminDashboardComponent {

    currentTab = signal('general');
    loading = signal(false);

    constructor() { }

    refreshData() {
        this.loading.set(true);

        // Simulamos solo un pequeño delay, sin datos falsos
        setTimeout(() => {
            this.loading.set(false);
        }, 700);
    }

    get fechaActual(): Date {
        return new Date();
    }

    getTabClass(tabName: string): string {
        return this.currentTab() === tabName
            ? 'border-[#002777] text-[#002777]'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';
    }

    getIconClass(tabName: string): string {
        return this.currentTab() === tabName
            ? 'text-[#62CEEA]'
            : 'text-slate-400 group-hover:text-slate-500';
    }
}
