import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, of, Subject, switchMap, takeUntil, timer } from 'rxjs';

interface SheetRow {
  row_number: number;
  'Marca temporal': string;
  'Correo corporativo': string;
  'Nombre completo': string;
  Cargo: string;
  'Puntaje Dados': number;
  'Puntaje Raspe': number;
  'Nombre Empresa': string;
  Total: number;
}

interface SheetResponse {
  data: SheetRow[];
  total: number;
}

/** Fila ya rankeada y comparada contra el poll anterior. */
interface RankedRow {
  id: number;
  position: number;
  name: string;
  company: string;
  initials: string;
  dados: number;
  raspe: number;
  total: number;
  /** Puestos ganados desde el poll anterior (negativo = perdidos). */
  delta: number;
  isNew: boolean;
  justScored: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'angular-quickstart';
  iframeUrl: { default?: SafeResourceUrl; community?: SafeResourceUrl } = {};

  private readonly endpoint = 'https://qptech.app.n8n.cloud/webhook/sheet-data';
  private readonly pollIntervalMs = 5000;
  private readonly destroy$ = new Subject<void>();

  /** Posicion y puntaje del poll anterior, para detectar movimientos. */
  private previousPositions = new Map<number, number>();
  private previousTotals = new Map<number, number>();
  private firstLoad = true;

  rows: RankedRow[] = [];
  isLoading = true;
  hasError = false;
  lastUpdated: Date | null = null;
  search = '';
  companyFilter = '';

  constructor(private _http: HttpClient) {}

  ngOnInit(): void {
    timer(0, this.pollIntervalMs)
      .pipe(
        switchMap(() =>
          this._http
            .post<SheetResponse>(this.endpoint, {})
            .pipe(catchError(() => of(null))),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.isLoading = false;

        if (!response) {
          this.hasError = true;
          return;
        }

        this.hasError = false;
        this.rows = this.rank(response.data ?? []);
        this.lastUpdated = new Date();
        this.firstLoad = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Filas tras buscador y filtro de empresa. El puesto se calcula siempre sobre
   * el ranking completo: filtrar no reordena, solo esconde.
   */
  get visibleRows(): RankedRow[] {
    const term = this.search.trim().toLowerCase();

    return this.rows.filter((row) => {
      const matchesCompany =
        !this.companyFilter || row.company === this.companyFilter;
      const matchesTerm =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.company.toLowerCase().includes(term);

      return matchesCompany && matchesTerm;
    });
  }

  /** Empresas presentes en el ranking, para el desplegable. */
  get companies(): string[] {
    const unique = new Set(this.rows.map((row) => row.company).filter(Boolean));

    return [...unique].sort((a, b) => a.localeCompare(b, 'es'));
  }

  get isFiltered(): boolean {
    return !!this.companyFilter || !!this.search.trim();
  }

  get companyLabel(): string {
    return this.companyFilter || 'Todas las empresas';
  }

  onSearch(value: string): void {
    this.search = value;
  }

  onCompany(value: string): void {
    this.companyFilter = value;
  }

  trackByRow(_index: number, row: RankedRow): number {
    return row.id;
  }

  trackByCompany(_index: number, company: string): string {
    return company;
  }

  private rank(data: SheetRow[]): RankedRow[] {
    const ordered = [...data].sort(
      (a, b) => (Number(b.Total) || 0) - (Number(a.Total) || 0),
    );

    const ranked = ordered.map((row, index) => {
      const position = index + 1;
      const total = Number(row.Total) || 0;
      const previousPosition = this.previousPositions.get(row.row_number);
      const previousTotal = this.previousTotals.get(row.row_number);

      return {
        id: row.row_number,
        position,
        name: (row['Nombre completo'] || '').trim() || 'Participante',
        company: (row['Nombre Empresa'] || '').trim(),
        initials: this.initialsOf(row['Nombre completo']),
        dados: Number(row['Puntaje Dados']) || 0,
        raspe: Number(row['Puntaje Raspe']) || 0,
        total,
        delta: previousPosition === undefined ? 0 : previousPosition - position,
        isNew: !this.firstLoad && previousPosition === undefined,
        justScored: previousTotal !== undefined && previousTotal !== total,
      };
    });

    this.previousPositions = new Map(
      ranked.map((row) => [row.id, row.position]),
    );
    this.previousTotals = new Map(ranked.map((row) => [row.id, row.total]));

    return ranked;
  }

  private initialsOf(name: string): string {
    return (name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
