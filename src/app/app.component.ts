import { Component } from '@angular/core';

/* Shell de rutas: el ranking (antes vivia aca) se movio a RankingComponent
   ('') y el formulario de registro a RegistroComponent ('/registro'), para
   que este componente pueda mostrar uno u otro segun la URL. */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {}
