import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LogRegComponent } from './Components/log-reg/log-reg.component';
import { AddMatchComponent } from './Components/add-match/add-match.component';
import { AddTeamComponent } from './Components/add-team/add-team.component';
import { ListingComponent } from './Components/listing/listing.component';
import { UserComponent } from './Components/user/user.component';
import { ShowUserComponent } from './Components/show-user/show-user.component';
import { ShowTeamComponent } from './Components/show-team/show-team.component';

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
    path: 'add-match',
    pathMatch: 'full',
    component: AddMatchComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
