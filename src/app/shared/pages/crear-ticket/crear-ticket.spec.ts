import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi, expect } from 'vitest';
import { CrearTicketComponent } from './crear-ticket';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

const baseUser = { nombre_rol: 'soporte', nombre_completo: 'Tester' };
const authMock = { getUser: vi.fn(() => baseUser) };
const ticketMock = {
    getLocations: vi.fn(() =>
        of({ success: true, data: { tipos_ubicacion: { ubicaciones: [] } } })
    ),
    createTicket: vi.fn(() => of({ success: true })),
};
const toastrMock = { warning: vi.fn(), error: vi.fn(), success: vi.fn() };
const routerMock = { navigate: vi.fn() };

describe('CrearTicketComponent', () => {
    let fixture: ComponentFixture<CrearTicketComponent>;
    let component: CrearTicketComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrearTicketComponent],
            providers: [
                { provide: AuthService, useValue: authMock },
                { provide: TicketService, useValue: ticketMock },
                { provide: ToastrService, useValue: toastrMock },
                { provide: Router, useValue: routerMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CrearTicketComponent);
        component = fixture.componentInstance;
        component.asunto = 'A';
        component.descripcion = 'B';
        component.telefono = '123';
        component.autor_problema = 'Tester';
        component.ubicacion_id = 1;
        component.ip_manual = '1.1.1.1';
    });

    it('si el rol es soporte/administrador exige evento_id', () => {
        component.role = 'soporte';
        component.evento_id = null;
        component.onSubmit();
        expect(toastrMock.warning).toHaveBeenCalledWith(
            'Debes clasificar el tipo de evento',
            'Faltan datos'
        );
    });

    it('para rol usuario no incluye evento_id en el payload', () => {
        authMock.getUser.mockReturnValue({ nombre_rol: 'usuario', nombre_completo: 'Tester' });
        component.role = 'usuario';
        component.onSubmit();

        const calls = ticketMock.createTicket.mock.calls as unknown as any[][];
        expect(calls.length).toBe(1);
        const payload = calls[0]?.[0] as any;
        expect(payload).toBeDefined();
        expect(payload.evento_id).toBeUndefined();
    });
});
