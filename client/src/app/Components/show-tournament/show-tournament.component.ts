import { Component, OnInit } from '@angular/core';
import { TournamentService } from 'src/app/Services/tournament.service';
import { TournamentRegistrationService } from 'src/app/Services/tournament-registration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ITournament, ITeamType } from '../../../../../interfaces/tournament';
import { ITournamentRegistrations } from '../../../../../interfaces/tournament-registrations';
import { IUser } from '../../../../../interfaces/user';
import { UserService } from 'src/app/Services/user.service';
import { RED, GREEN } from '../../../../../settings/variables';

@Component({
  selector: 'app-show-tournament',
  templateUrl: './show-tournament.component.html',
  styleUrls: ['./show-tournament.component.css']
})
export class ShowTournamentComponent implements OnInit {
  private tournamentID: number;
  private tournament: ITournament;
  private tournamentRegistrations: ITournamentRegistrations[];

  private showMsg: boolean;
  private msg: string;
  private msgColor: string;

  constructor(
    private tournamentService: TournamentService,
    private tournamentRegService: TournamentRegistrationService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {
    this.tournamentID = Number(this.route.snapshot.queryParams.id);
    this.tournament = null;
    this.tournamentRegistrations = [];

    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';
  }

  ngOnInit() {
    if (isNaN((this.tournamentID))) {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
      return;
    }

    this.tournamentService.getTournament(this.tournamentID)
    .then((tournament: ITournament) => {
      this.tournament = tournament;
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
    });

    this.tournamentRegService.getRegisterations(this.tournamentID)
    .then((tr: ITournamentRegistrations[]) => {
      this.tournamentRegistrations = tr;
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
    });
  }

  public get getLoggedUser(): IUser {
    return this.userService.getLoggedData;
  }

  public canJoinAsReferee(userID: number): boolean {
    if (this.tournament.referee_id !== null) {
      return false;
    }

    const index: number = this.tournamentRegistrations.findIndex((tr: ITournamentRegistrations) => tr.user_id === userID);

    if (index < 0) {
      return true;
    }

    return false;
  }

  public canJoinAsTeam(teamID: number): boolean {
    if (this.tournament.team_type === ITeamType.PvP) {
      return false;
    }

    if (teamID === null || teamID === undefined) {
      return false;
    }

    const index: number = this.tournamentRegistrations.findIndex((tr: ITournamentRegistrations) => tr.team_id === teamID);

    if (index < 0) {
      return true;
    }

    return false;
  }

  public canJoinAsUser(userID: number): boolean {
    // Check if given tournament is for users
    if (this.tournament.team_type !== ITeamType.PvP) {
      return false;
    }

    if (this.tournament.referee_id === userID) {
      return false;
    }

    const index: number = this.tournamentRegistrations.findIndex((tr: ITournamentRegistrations) => tr.user_id === userID);

    if (index < 0) {
      return true;
    }

    return false;
  }

  public joinAsReferee(userID: number): void {
    this.showMsg = false;

    this.tournamentRegService.registerAsReferee(this.tournamentID, userID)
    .then(() => {
      this.tournamentRegService.getRegisterations(this.tournamentID)
      .then((trs: ITournamentRegistrations[]) => {
        this.tournamentRegistrations = trs;
      })
      .catch(() => {
        this.tournamentRegistrations = [];
      });
      this.msg = 'You have been successfully registered. Now wait for creator to accept you.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem with registering. Please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public joinAsTeam(teamID: number): void {
    this.showMsg = false;

    this.tournamentRegService.registerAsTeam(this.tournamentID, teamID)
    .then(() => {
      this.tournamentRegService.getRegisterations(this.tournamentID)
      .then((trs: ITournamentRegistrations[]) => {
        this.tournamentRegistrations = trs;
      })
      .catch(() => {
        this.tournamentRegistrations = [];
      });
      this.msg = 'You have been successfully registered. Now wait for creator to accept you.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem with registering. Please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public joinAsUser(userID: number): void {
    this.showMsg = false;

    this.tournamentRegService.registerAsUser(this.tournamentID, userID)
    .then(() => {
      this.tournamentRegService.getRegisterations(this.tournamentID)
      .then((trs: ITournamentRegistrations[]) => {
        this.tournamentRegistrations = trs;
      })
      .catch(() => {
        this.tournamentRegistrations = [];
      });
      this.msg = 'You have been successfully registered. Now wait for creator to accept you.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem with registering. Please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public closeMessage(): void {
    this.showMsg = false;
  }
}
