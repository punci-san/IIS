import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { TopbarComponent } from './Components/topbar/topbar.component';
import { AppComponent } from './Components/app/app.component';
import { LogRegComponent } from './Components/log-reg/log-reg.component';
import { AddTeamComponent } from './Components/add-team/add-team.component';
import { TeamListingComponent } from './Components/team-listing/team-listing.component';
import { UserListingComponent } from './Components/user-listing/user-listing.component';
import { ListingComponent } from './Components/listing/listing.component';
import { UserComponent } from './Components/user/user.component';
import { ShowUserComponent } from './Components/show-user/show-user.component';
import { ShowTeamComponent } from './Components/show-team/show-team.component';
import { AddTournamentComponent } from './Components/add-tournament/add-tournament.component';
import { TournamentListingComponent } from './Components/tournament-listing/tournament-listing.component';
import { ShowTournamentComponent } from './Components/show-tournament/show-tournament.component';
import { SpiderComponent } from './Components/spider/spider.component';

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    LogRegComponent,
    AddTeamComponent,
    TeamListingComponent,
    UserListingComponent,
    ListingComponent,
    UserComponent,
    ShowUserComponent,
    ShowTeamComponent,
    AddTournamentComponent,
    TournamentListingComponent,
    ShowTournamentComponent,
    SpiderComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
