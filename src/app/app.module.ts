import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeEsCL from '@angular/common/locales/es-CL';
import { LOCALE_ID, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RankingComponent } from './ranking/ranking.component';
import { RegistroComponent } from './registro/registro.component';

/* Sin esto los puntajes salen con coma de miles (9,920): el ranking se lee en
   Chile, va con punto (9.920). */
registerLocaleData(localeEsCL);

@NgModule({
  declarations: [AppComponent, RankingComponent, RegistroComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es-CL' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
