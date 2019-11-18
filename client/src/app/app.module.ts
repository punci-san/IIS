import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { TopbarComponent } from './Components/topbar/topbar.component';
import { AppComponent } from './Components/app/app.component';
import { LogRegComponent } from './Components/log-reg/log-reg.component';
import { AddTeamComponent } from './Components/add-team/add-team.component';
import { AddMatchComponent } from './Components/add-match/add-match.component';
import { TeamListingComponent } from './Components/team-listing/team-listing.component';
import { UserListingComponent } from './Components/user-listing/user-listing.component';
import { MatchListingComponent } from './Components/match-listing/match-listing.component';
import { ListingComponent } from './Components/listing/listing.component';
import { UserComponent } from './Components/user/user.component';
import { ShowUserComponent } from './Components/show-user/show-user.component';

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    LogRegComponent,
    AddTeamComponent,
    AddMatchComponent,
    TeamListingComponent,
    UserListingComponent,
    MatchListingComponent,
    ListingComponent,
    UserComponent,
    ShowUserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
