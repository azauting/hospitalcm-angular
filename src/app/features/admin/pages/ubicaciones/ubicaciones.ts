import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TypeService } from '../../../../core/services/tipo.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-admin-locations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ubicaciones.html'
})
export class LocationsComponent implements OnInit {

    // DATA
    locations = signal<any[]>([]);
    areas = signal<any[]>([]);

    // STATES
    loading = signal(false);
    activeTab = signal<'locations' | 'areas'>('locations');

    // MODALS
    locationModal: any = null;
    areaModal: any = null;

    // FILTER
    searchFilter = signal('');

    constructor(
        private typeService: TypeService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);

        this.typeService.getAreas().subscribe({
            next: (resp: any) => {
                if (resp.success)
                    this.areas.set(resp.data?.tipos_area?.areas || []);

                this.typeService.getLocations()
                    .pipe(finalize(() => this.loading.set(false)))
                    .subscribe({
                        next: (r: any) => {
                            if (r.success) this.locations.set(r.data?.tipos_ubicacion?.ubicaciones || []);
                        },
                        error: () => this.toastr.error('Error cargando ubicaciones')
                    });
            },
            error: () => {
                this.loading.set(false);
                this.toastr.error('Error cargando áreas');
            }
        });
    }

    // =========================
    // LOCATION MANAGEMENT
    // =========================
    saveLocation(name: string, areaId: string) {

        if (!name || !areaId) {
            this.toastr.warning('Complete los datos');
            return;
        }

        const payload = { location: name, area_id: Number(areaId) };
        const isEdit = this.locationModal?.ubicacion_id;

        const request = isEdit
            ? this.typeService.updateLocation(isEdit, payload)
            : this.typeService.createLocation(payload);

        request.subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.toastr.success(isEdit ? 'Ubicación actualizada' : 'Ubicación creada');
                    this.locationModal = null;
                    this.loadData();
                } else {
                    this.toastr.error(resp.message);
                }
            },
            error: () => this.toastr.error('Error en el servidor')
        });
    }

    // =========================
    // AREA MANAGEMENT
    // =========================
    saveArea(name: string) {

        if (!name) {
            this.toastr.warning('Ingrese el nombre del área');
            return;
        }

        const payload = { area_name: name };
        const isEdit = this.areaModal?.area_id;

        const request = isEdit
            ? this.typeService.updateArea(isEdit, payload)
            : this.typeService.createArea(payload);

        request.subscribe({
            next: (resp: any) => {
                if (resp.success) {
                    this.toastr.success(isEdit ? 'Área actualizada' : 'Área creada');
                    this.areaModal = null;
                    this.loadData();
                } else {
                    this.toastr.error(resp.message);
                }
            },
            error: () => this.toastr.error('Error en el servidor')
        });
    }

    // =========================
    // FILTERS
    // =========================
    getFilteredLocations() {
        const search = this.searchFilter().toLowerCase();
        return this.locations().filter(l =>
            l.ubicacion.toLowerCase().includes(search) ||
            (l.nombre_area && l.nombre_area.toLowerCase().includes(search))
        );
    }

    getFilteredAreas() {
        const search = this.searchFilter().toLowerCase();
        return this.areas().filter(a =>
            a.nombre_area.toLowerCase().includes(search)
        );
    }
}
