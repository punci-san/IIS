import { Component, OnInit } from '@angular/core';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam } from '../../../../../interfaces/team';
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

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private router: Router
    ) {
      this.user = null;
    }

  ngOnInit() {
    this.user = this.userService.getLoggedData;
  }

  public get getTeams(): ITeam[] {
    return this.teamService.getTeams;
  }

  public joinTeam(id: number): void {
    const currUser: IUser = this.userService.getLoggedData;
    if (currUser === null) {
      return;
    }

    if (currUser.team !== null) {
      return;
    }

    const usr: IUser = {
      id: currUser.id,
      admin: currUser.admin,
      description: currUser.description,
      name: currUser.name,
      team: id,
    };

    this.userService.updateUser(usr, null)
    .then(() => {
      this.user = this.userService.getLoggedData;
      this.router.navigate([''], { queryParams: { succ: true, msg: 'You have successfuly joined team.', listing: 'team'}});
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'There was a problem while joining team.', listing: 'team'}});
    });
  }
}
