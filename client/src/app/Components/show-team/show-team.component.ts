import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam, ITeamRequest } from '../../../../../interfaces/team';
import { IUser } from '../../../../../interfaces/user';
import { UserService } from 'src/app/Services/user.service';
import { RED, GREEN } from '../../../../../settings/variables';
import { ITeamStatistics } from '../../../../../interfaces/statistics';
import { StatisticService } from 'src/app/Services/statistic.service';

@Component({
  selector: 'app-show-team',
  templateUrl: './show-team.component.html',
  styleUrls: ['./show-team.component.css']
})
export class ShowTeamComponent implements OnInit {
  private teamID: number;
  private users: IUser[];

  public team: ITeam;
  public teamUsers: IUser[];
  public teamRequests: ITeamRequest[];
  public showMsg: boolean;
  public msg: string;
  public msgColor: string;

  public teamStat: ITeamStatistics;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teamService: TeamService,
    private userService: UserService,
    private statService: StatisticService,
    ) {
    this.team = null;
    this.users = [];
    this.teamUsers = [];
    this.teamRequests = [];

    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';

    this.teamStat = null;
  }

  ngOnInit() {
    this.teamID = Number(this.route.snapshot.params.id);
    if (isNaN(this.teamID)) {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given team does not exist', listing: 'team'}});
    }

    this.statService.getTeamStatistic(this.teamID)
    .then((stat: ITeamStatistics) => {
      this.teamStat = stat;
    })
    .catch(() => {
      this.teamStat = null;
    });

    this.teamService.getTeam(this.teamID)
    .then((teamData: ITeam) => {
      this.team = teamData;
      this.userService.getTeamUsers(this.team.id)
      .then((users: IUser[]) => {
        this.teamUsers = users;
      })
      .catch(() => {
        this.teamUsers = [];
      });

      this.users = this.userService.getUsers;

      this.teamService.getTeamRequests(this.team.id)
      .then((tr: ITeamRequest[]) => {
        this.teamRequests = tr;
      })
      .catch(() => {
        this.teamRequests = [];
      });
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given team does not exist', listing: 'team'}});
    });
  }

  public get getUser(): IUser {
    return this.userService.getLoggedData;
  }

  public getTeamLogo(fileName: string): string {
    return this.teamService.getTeamLogo(fileName);
  }

  public getUserData(userID: number) {
    const index: number = this.users.findIndex((usr: IUser) => usr.id === userID);

    if (index < 0) {
      return null;
    }

    return this.users[index];
  }

  public showUser(userID: number): void {
    this.router.navigate(['show-user'], { queryParams: { id: userID}});
  }

  public acceptJoin(teamRequestID: number): void {
    this.showMsg = false;

    // Accept team member
    this.teamService.acceptTeamJoin(teamRequestID, this.teamID)
    .then(() => {
      // Update team members
      this.userService.getTeamUsers(this.team.id)
      .then((users: IUser[]) => {
        this.teamUsers = users;
      })
      .catch(() => {
        this.teamUsers = [];
      });

      // Update requests
      this.teamService.getTeamRequests(this.team.id)
      .then((tr: ITeamRequest[]) => {
        this.teamRequests = tr;
      })
      .catch();
    })
    .catch(() => {
      this.showMsg = true;
      this.msgColor = RED;
      this.msg = 'Problem while trying to accept user. Please try again';
    });
  }

  public denyJoin(teamRequestID: number): void {
    this.showMsg = false;

    // Accept team member
    this.teamService.denyTeamJoin(teamRequestID, this.teamID)
    .then(() => {
      // Update requests
      this.teamService.getTeamRequests(this.team.id)
      .then((tr: ITeamRequest[]) => {
        this.teamRequests = tr;
      })
      .catch();
    })
    .catch(() => {
      this.showMsg = true;
      this.msgColor = RED;
      this.msg = 'Problem while trying to deny user. Please try again';
    });
  }

  public kickUser(userID: number): void {
    this.showMsg = false;
    this.teamService.kickUser(userID, this.teamID)
    .then(() => {
      // Update team members
      this.userService.getTeamUsers(this.team.id)
      .then((users: IUser[]) => {
        this.teamUsers = users;
      })
      .catch(() => {
        this.teamUsers = [];
      });
      this.msg = 'User was successfully kicked from team.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem while trying to kick user, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public makeTeamLeader(userID: number): void {
    this.showMsg = false;

    this.teamService.makeTeamLeader(this.teamID, userID)
    .then((teamData: ITeam) => {
      this.team = teamData;
      this.msg = 'Team admin changed.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem while trying to change team admin, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public closeMessage(): void {
    this.showMsg = false;
  }
}
