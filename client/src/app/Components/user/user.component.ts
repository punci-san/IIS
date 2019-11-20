import { Component, OnInit } from '@angular/core';
import { IUser } from '../../../../../interfaces/user';
import { UserService } from 'src/app/Services/user.service';
import { Router } from '@angular/router';
import { RED, GREEN } from '../../../../../settings/variables';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam } from '../../../../../interfaces/team';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  private user: IUser;
  private showMsg: boolean;
  private msg: string;
  private msgColor: string;
  private pass1: string;
  private pass2: string;
  private team: ITeam;

  constructor(
    private userService: UserService,
    private teamService: TeamService,
    private router: Router
  ) {
    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';

    this.pass1 = '';
    this.pass2 = '';

    this.team = null;
  }

  ngOnInit() {
    this.user = this.userService.getLoggedData;

    if (this.user === null) {
      this.router.navigate(['user-log_reg'], { queryParams: { succ: false, msg: 'You need to be logged in to change your username.'}});
    }

    this.getTeamData();
  }

  public updateData(): void {
    let pass = '';

    if (this.pass1 === '' && this.pass2 === '') {
      pass = null;
    }

    if (pass !== null) {
      if (this.pass1 !== this.pass2) {
        this.msg = 'Passwords do not match.';
        this.showMsg = true;
        this.msgColor = RED;
        return;
      }
      pass = this.pass1;
    }

    this.userService.updateUser(this.user, pass)
    .then(() => {
      this.router.navigate([''], { queryParams: { succ: true, msg: 'Successfully updated your data.'}});
    })
    .catch(() => {
      this.msg = 'Problem occured while updating data, please try again.';
      this.showMsg = true;
      this.msgColor = RED;
    });
  }

  public closeMessage(): void {
    this.showMsg = false;
  }

  private getTeamData(): void {
    if (this.user.team !== null) {
      this.teamService.getTeam(this.user.team)
      .then((res: ITeam) => {
        this.team = res;
      })
      .catch();
    }
  }

  public leaveTeam(): void {
    if (this.user.team !== null) {
      const usr: IUser = {
        id: this.user.id,
        admin: this.user.admin,
        team: null,
        description: this.user.description,
        name: this.user.name,
      };

      this.userService.updateUser(usr, null)
      .then(() => {
        this.user = this.userService.getLoggedData;
        this.msg = 'You have successfully left the team.';
        this.showMsg = true;
        this.msgColor = GREEN;
      })
      .catch(() => {
        this.msg = 'Problem occured while updating data, please try again.';
        this.showMsg = true;
        this.msgColor = RED;
      });
    }
  }

  public deteleTeam(): void {
    if (this.user.team !== null) {
      this.teamService.deleteTeam(this.user.team)
      .then(() => {
        this.user.team = null;
        this.msg = 'You have successfully removed all users from given team and deleted team.';
        this.showMsg = true;
        this.msgColor = GREEN;
      })
      .catch(() => {
        this.msg = 'There was a problem while deleting team.';
        this.showMsg = true;
        this.msgColor = RED;
      });
    }
  }
}
