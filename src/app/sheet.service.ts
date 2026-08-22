import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SheetRow {
  row_number: number | string;
  'Marca temporal': string;
  'Correo corporativo': string;
  'Nombre completo': string;
  Cargo: string;
  'Puntaje Dados': number;
  'Puntaje Raspe': number;
  'Nombre Empresa': string;
  Total: number;
}

export interface SheetResponse {
  data: SheetRow[];
  total: number;
}

/** Formato nuevo del endpoint: llega como array plano, sin el wrapper {data, total}. */
export interface SheetRowNew {
  id: string;
  createdAt: string;
  marca: string;
  correo: string;
  nombre: string;
  cargo: string;
  puntajeDados: number;
  puntajeRaspe: number;
  nombreEmpresa: string;
  total: number;
}

export type SheetApiResponse = SheetResponse | SheetRowNew[];

/** Cuerpo que espera el endpoint al registrar una participacion nueva (POST):
 *  es el formato nuevo de fila sin id/createdAt/total, que pone el backend. */
export interface NewParticipant {
  marca: string;
  correo: string;
  nombre: string;
  cargo: string;
  puntajeDados: number;
  puntajeRaspe: number;
  nombreEmpresa: string;
}

@Injectable({ providedIn: 'root' })
export class SheetService {
  /* Mismo endpoint para leer el ranking (GET) y registrar una participacion
     (POST): el shape del GET nuevo (SheetRowNew) es el de este POST con
     id/createdAt/total agregados por el backend. */
  readonly endpoint = 'https://app-sample-e8c098cfc70b.herokuapp.com/sample';

  constructor(private http: HttpClient) {}

  getRanking(): Observable<SheetApiResponse> {
    return this.http.get<SheetApiResponse>(this.endpoint);
  }

  submitParticipant(entry: NewParticipant): Observable<unknown> {
    return this.http.post(this.endpoint, entry);
  }
}
