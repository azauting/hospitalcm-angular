import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TypeService } from '../../../../core/services/tipo.service';

interface EventType {
    evento_id: number;
    evento: string;
}

@Component({
    selector: 'app-event-type',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './tipo-evento.html',
})
export class EventTypeComponent implements OnInit {

    private typeService = inject(TypeService);
    private fb = inject(FormBuilder);

    // --- STATE SIGNALS ---
    eventTypes = signal<EventType[]>([]);
    loading = signal<boolean>(true);
    errorMsg = signal<string | null>(null);

    // --- MODAL STATE ---
    showModal = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    selectedId = signal<number | null>(null);
    saving = signal<boolean>(false);

    // --- FORM ---
    form: FormGroup = this.fb.group({
        evento: ['', [Validators.required, Validators.minLength(3)]]
    });

    ngOnInit(): void {
        this.loadEventTypes();
    }

    loadEventTypes() {
        this.loading.set(true);
        this.typeService.getEvents().subscribe({
            next: (res) => {
                if (res.success && res.data?.tipos_evento?.tipos) {
                    this.eventTypes.set(res.data.tipos_evento.tipos);
                } else {
                    this.eventTypes.set([]);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.errorMsg.set('No se pudieron cargar los tipos de evento.');
                this.loading.set(false);
            }
        });
    }

    // --- MODAL ACTIONS ---
    openCreateModal() {
        this.isEditing.set(false);
        this.selectedId.set(null);
        this.form.reset();
        this.showModal.set(true);
    }

    openEditModal(item: EventType) {
        this.isEditing.set(true);
        this.selectedId.set(item.evento_id);
        this.form.patchValue({
            evento: item.evento
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.form.reset();
        this.saving.set(false);
    }

    // --- SAVE (CREATE OR EDIT) ---
    save() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const data = this.form.value; // { evento: string }
        this.saving.set(true);

        // EDIT
        if (this.isEditing() && this.selectedId()) {
            this.typeService.updateEvent(this.selectedId()!, data).subscribe({
                next: () => this.handleSuccess(),
                error: (err) => this.handleError(err)
            });
        }

        // CREATE
        else {
            this.typeService.createEvent(data).subscribe({
                next: () => this.handleSuccess(),
                error: (err) => this.handleError(err)
            });
        }
    }

    private handleSuccess() {
        this.closeModal();
        this.loadEventTypes();
        this.saving.set(false);
    }

    private handleError(err: any) {
        console.error(err);
        alert('Ocurrió un error al procesar la solicitud.');
        this.saving.set(false);
    }
}
