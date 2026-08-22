import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RankingComponent } from './ranking/ranking.component';
import { RegistroComponent } from './registro/registro.component';

const routes: Routes = [
  { path: '', component: RankingComponent },
  { path: 'registro', component: RegistroComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
