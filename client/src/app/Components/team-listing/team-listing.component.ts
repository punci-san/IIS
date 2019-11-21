import { Component, OnInit } from '@angular/core';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam, ITeamRequest } from '../../../../../interfaces/team';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-listing',
  templateUrl: './team-listing.component.html',
  styleUrls: ['./team-listing.component.css']
})
export class TeamListingComponent implements OnInit {
  private user: IUser;
  private teamRequests: ITeamRequest[];

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private router: Router
    ) {
      this.user = null;
      this.teamRequests = [];
    }

  ngOnInit() {
    this.user = this.userService.getLoggedData;
    this.teamService.getTeamRequests()
    .then((teamReqs: ITeamRequest[]) => {
      this.teamRequests = teamReqs;
    })
    .catch();
  }

  public get getTeams(): ITeam[] {
    return this.teamService.getTeams;
  }

  public joinSend(teamID: number): boolean {
    return this.teamRequests.findIndex((tr: ITeamRequest) => tr.team_id === teamID) >= 0;
  }

  public joinTeam(teamID: number): void {
    const currUser: IUser = this.userService.getLoggedData;
    if (currUser === null) {
      return;
    }

    if (currUser.team !== null) {
      return;
    }

    this.teamService.joinTeam(currUser.id, teamID)
    .then(() => {
      this.teamService.getTeamRequests()
      .then((teamReqs: ITeamRequest[]) => {
        this.teamRequests = teamReqs;
      })
      .catch();
      this.router.navigate([''], { queryParams: { succ: true, msg: 'Successfully send request to join team.', listing: 'team'}});
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'There was an error while trying to send request.', listing: 'team'}});
    });
  }

  public showTeam(teamID: number): void {
    this.router.navigate(['show-team'], { queryParams: { id: teamID}});
  }
}
