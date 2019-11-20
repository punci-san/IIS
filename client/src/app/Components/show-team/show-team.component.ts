import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam } from '../../../../../interfaces/team';
import { IUser } from '../../../../../interfaces/user';
import { UserService } from 'src/app/Services/user.service';

@Component({
  selector: 'app-show-team',
  templateUrl: './show-team.component.html',
  styleUrls: ['./show-team.component.css']
})
export class ShowTeamComponent implements OnInit {
  private teamID: number;
  private team: ITeam;
  private users: IUser[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teamService: TeamService,
    private userService: UserService
    ) {
    this.teamID = Number(this.route.snapshot.params.id);
    this.team = null;
    this.users = [];
  }

  ngOnInit() {
    if (isNaN(this.teamID)) {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given team does not exist', listing: 'team'}});
    }
    this.teamService.getTeam(this.teamID)
    .then((teamData: ITeam) => {
      this.team = teamData;
      this.userService.getTeamUsers(this.team.id)
      .then((users: IUser[]) => {
        this.users = users;
      })
      .catch(() => {
        this.users = [];
      });
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given team does not exist', listing: 'team'}});
    });
  }

  public showUser(userID: number): void {
    this.router.navigate(['show-user'], { queryParams: { id: userID}});
  }

  public kickUser(userID: number): void {
    
  }
}
