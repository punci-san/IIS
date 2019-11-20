import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';
import { TeamService } from 'src/app/Services/team.service';
import { MatchService } from 'src/app/Services/match.service';
import { Router } from '@angular/router';
import { ITeam } from '../../../../../interfaces/team';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  private searchValue: string;

  constructor(
    private userService: UserService,
    private teamService: TeamService,
    private matchService: MatchService,
    private router: Router
  ) {
    this.searchValue = '';
  }

  ngOnInit() {
  }

  public get getUserData(): IUser {
    return this.userService.getLoggedData;
  }

  public get getTeamdata(): ITeam {
    const teams: ITeam[] = this.teamService.getTeams;
    const user: IUser = this.userService.getLoggedData;

    if (user === null) {
      return null;
    }

    if (user.team === null) {
      return null;
    }

    const tm: ITeam = teams.find((team: ITeam) => team.id === user.team);

    if (tm === undefined) {
      return null;
    }

    return tm;
  }

  public logout(): void {
    this.userService.logout();
    this.router.navigate([''], { queryParams: { succ: true, msg: 'You have been successfully logged out.'}});
  }

  public updateFilter(): void {
    this.userService.filterUsers(this.searchValue);
    this.teamService.filterTeams(this.searchValue);
    this.matchService.filterMatches(this.searchValue);
  }
}
