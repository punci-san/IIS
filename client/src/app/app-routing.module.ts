import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LogRegComponent } from './Components/log-reg/log-reg.component';
import { AddTeamComponent } from './Components/add-team/add-team.component';
import { ListingComponent } from './Components/listing/listing.component';
import { UserComponent } from './Components/user/user.component';
import { ShowUserComponent } from './Components/show-user/show-user.component';
import { ShowTeamComponent } from './Components/show-team/show-team.component';
import { AddTournamentComponent } from './Components/add-tournament/add-tournament.component';
import { ShowTournamentComponent } from './Components/show-tournament/show-tournament.component';

const routes: Routes = [
  {
    path: '',
    component: ListingComponent,
  },
  {
    path: 'user',
    pathMatch: 'full',
    component: UserComponent,
  },
  {
    path: 'show-user',
    pathMatch: 'full',
    component: ShowUserComponent,
  },
  {
    path: 'user-log_reg',
    pathMatch: 'full',
    component: LogRegComponent,
  },
  {
    path: 'add-team',
    pathMatch: 'full',
    component: AddTeamComponent,
  },
  {
    path: 'show-team/:id',
    pathMatch: 'full',
    component: ShowTeamComponent,
  },
  {
    path: 'add-tournament',
    pathMatch: 'full',
    component: AddTournamentComponent,
  },
  {
    path: 'show-tournament',
    pathMatch: 'full',
    component: ShowTournamentComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
