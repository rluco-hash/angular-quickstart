import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  catchError,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';

import {
  SheetApiResponse,
  SheetRow,
  SheetRowNew,
  SheetService,
} from '../sheet.service';

/* Participantes falsos para QA de disenio: se usan o no segun la linea marcada
   en fetchSheet(). El import puede quedar ahi en los dos casos; con la linea
   comentada el bundler deja el JSON afuera (main.js pasa de ~130 a ~126 kB). */
import * as MOCK_SHEET_DATA from '../mock-sheet-data.json';

/** Fila ya rankeada y comparada contra el poll anterior. */
interface RankedRow {
  id: number | string;
  position: number;
  name: string;
  company: string;
  initials: string;
  /** Medalla del puesto (vacia del cuarto en adelante). */
  medal: string;
  dados: number;
  raspe: number;
  total: number;
  /** Puestos ganados desde el poll anterior (negativo = perdidos). */
  delta: number;
  isNew: boolean;
  justScored: boolean;
}

/** Tarjeta de red social con su QR ya generado (src/assets/qr). */
interface SocialLink {
  key: string;
  label: string;
  detail: string;
  /** Clase de Font Awesome; se ignora si hay iconImg. */
  icon?: string;
  /** Logo propio (SVG de assets/imgs) para las marcas que no estan en FA. */
  iconImg?: string;
  url: string;
  qr: string;
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.css'],
})
export class RankingComponent {
  /** Medallas del podio, indexadas por puesto. */
  private static readonly medals: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  title = 'angular-quickstart';
  iframeUrl: { default?: SafeResourceUrl; community?: SafeResourceUrl } = {};

  /** Fecha del sorteo, anunciada junto al premio. */
  readonly raffleDate = '1 de septiembre';

  private readonly whatsappNumber = '56971502877';
  private readonly whatsappMessage =
    'Hola QuePlan, les escribo desde Desafío Bienestar.';

  /* Los QR son SVG estaticos generados offline (encoder QR sobre las URLs de
     abajo). Si cambia una URL hay que regenerar el SVG correspondiente. */
  readonly socials: SocialLink[] = [
    {
      key: 'comparador',
      label: 'Comparador',
      detail: 'queplan.cl',
      iconImg: 'assets/imgs/lupa_qp.svg',
      url: 'https://www.queplan.cl',
      qr: 'assets/qr/qr-comparador.svg',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      detail: '@queplancl',
      icon: 'fab fa-instagram',
      url: 'https://www.instagram.com/queplancl/',
      qr: 'assets/qr/qr-instagram.svg',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      detail: 'QuePlan',
      icon: 'fab fa-linkedin-in',
      url: 'https://www.linkedin.com/company/queplan.cl/',
      qr: 'assets/qr/qr-linkedin.svg',
    },
  ];

  private readonly pollIntervalMs = 60000;
  private readonly destroy$ = new Subject<void>();

  /** Posicion y puntaje del poll anterior, para detectar movimientos. */
  private previousPositions = new Map<number | string, number>();
  private previousTotals = new Map<number | string, number>();
  private firstLoad = true;

  rows: RankedRow[] = [];
  isLoading = true;
  hasError = false;
  lastUpdated: Date | null = null;

  /** Participantes por pagina en el listado. */
  readonly pageSize = 10;
  page = 0;

  /* El podio y la lista muestran los mismos datos: 'lista' solo oculta el podio
     para dejar el ranking plano de corrido. */
  view: 'podio' | 'lista' = 'podio';

  constructor(private sheetService: SheetService) {}

  ngOnInit(): void {
    timer(0, this.pollIntervalMs)
      .pipe(
        switchMap(() => this.fetchSheet()),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.isLoading = false;

        if (!response) {
          this.hasError = true;
          return;
        }

        this.hasError = false;
        this.rows = this.rank(this.normalizeResponse(response));
        this.lastUpdated = new Date();
        this.firstLoad = false;
        // Si alguien se dio de baja, la ultima pagina puede dejar de existir:
        // se queda en la ultima valida en vez de mostrar una pagina vacia.
        this.page = Math.min(this.page, this.totalPages - 1);
      });
  }

  /* Fuente del poll.

     ==========================================================================
     DATOS DE PRUEBA ACTIVOS: la pantalla se llena con los 11 participantes
     falsos de mock-sheet-data.json y NO se le pega a ningun endpoint.

     Para volver al endpoint real hay que comentar la linea marcada aca abajo
     (la del `of(MOCK_SHEET_DATA)`).
     Con solo eso la pantalla queda vacia y en "Sin conexion" hasta que el
     endpoint real responda.
     ========================================================================== */
  private fetchSheet(): Observable<SheetApiResponse | null> {
    // >>> COMENTAR ESTA LINEA para usar el endpoint real <<<
    // return of(MOCK_SHEET_DATA as unknown as SheetApiResponse);

    // Queda inalcanzable mientras la linea de arriba siga activa: es a proposito,
    // asi el cambio de una fuente a la otra es comentar/descomentar y nada mas.
    return this.sheetService
      .getRanking()
      .pipe(catchError(() => of(null)));
  }

  /** El endpoint puede llegar en el formato viejo ({data, total}) o en el
   *  nuevo (array plano de filas con nombres de campo distintos). */
  private normalizeResponse(response: SheetApiResponse): SheetRow[] {
    const rows = Array.isArray(response) ? response : response.data ?? [];

    return rows.map((row) =>
      this.isNewFormatRow(row) ? this.fromNewFormat(row) : row,
    );
  }

  private isNewFormatRow(row: SheetRow | SheetRowNew): row is SheetRowNew {
    return 'nombre' in row;
  }

  private fromNewFormat(row: SheetRowNew): SheetRow {
    return {
      row_number: row.id,
      'Marca temporal': row.createdAt,
      'Correo corporativo': row.correo,
      'Nombre completo': row.nombre,
      Cargo: row.cargo,
      'Puntaje Dados': row.puntajeDados,
      'Puntaje Raspe': row.puntajeRaspe,
      'Nombre Empresa': row.nombreEmpresa,
      Total: row.total,
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Los tres del podio, ya ordenados por puntaje. */
  get podiumRows(): RankedRow[] {
    return this.rows.slice(0, 3);
  }

  /** Los 10 del tramo visible del listado (que arranca en el primer puesto). */
  get pagedRows(): RankedRow[] {
    const start = this.page * this.pageSize;

    return this.rows.slice(start, start + this.pageSize);
  }

  /** Siempre 1 como minimo: con lista vacia no existe la "pagina 0 de 0". */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get hasPages(): boolean {
    return this.rows.length > this.pageSize;
  }

  /** Puesto del primero y del ultimo de la pagina, para el "1 – 10 de 57". */
  get pageFrom(): number {
    return this.page * this.pageSize + 1;
  }

  get pageTo(): number {
    return Math.min(this.pageFrom + this.pageSize - 1, this.rows.length);
  }

  setView(view: 'podio' | 'lista'): void {
    this.view = view;
  }

  /* El desglose ya no ocupa lugar en la fila (el disenio la deja limpia): vive
     en el title, a un hover de distancia. */
  breakdownOf(row: RankedRow): string {
    return `Dados ${row.dados.toLocaleString('es-CL')} · Raspe ${row.raspe.toLocaleString(
      'es-CL',
    )}`;
  }

  goToPage(page: number): void {
    this.page = Math.min(Math.max(page, 0), this.totalPages - 1);
  }

  get whatsappUrl(): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(
      this.whatsappMessage,
    )}`;
  }

  trackByRow(_index: number, row: RankedRow): number | string {
    return row.id;
  }

  trackBySocial(_index: number, social: SocialLink): string {
    return social.key;
  }

  private rank(data: SheetRow[]): RankedRow[] {
    const ordered = [...data].sort(
      (a, b) => (Number(b.Total) || 0) - (Number(a.Total) || 0),
    );

    const ranked = ordered.map((row, index) => {
      const position = index + 1;
      const company = (row['Nombre Empresa'] || '').trim();
      const total = Number(row.Total) || 0;
      const previousPosition = this.previousPositions.get(row.row_number);
      const previousTotal = this.previousTotals.get(row.row_number);

      return {
        id: row.row_number,
        position,
        name: (row['Nombre completo'] || '').trim() || 'Participante',
        company,
        initials: this.initialsOf(row['Nombre completo']),
        medal: RankingComponent.medals[position] ?? '',
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
