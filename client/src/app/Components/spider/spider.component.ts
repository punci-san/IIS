import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ITournament, ITeamType } from '../../../../../interfaces/tournament';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';
import { numberOfPlayers, roundNames } from '../../../../../settings/tournament_config';
import { TeamService } from 'src/app/Services/team.service';
import { ITeam } from '../../../../../interfaces/team';
import { TournamentRegistrationService } from 'src/app/Services/tournament-registration.service';
import { ITournamentRegistrations } from '../../../../../interfaces/tournament-registrations';
import { IMatch } from '../../../../../interfaces/match';
import { MatchService } from 'src/app/Services/match.service';
import { RED, GREEN } from '../../../../../settings/variables';
import { TournamentService } from 'src/app/Services/tournament.service';
import { Router } from '@angular/router';
import { IMatchEvent } from '../../../../../interfaces/match_event';
import { MatchEventService } from '../../Services/match-event.service';

enum whatToShow {
  NOTHING = 'nothing',
  MATCH_ADDING = 'match_adding',
  MATCH_ADDED = 'match_added',
  STATISTICS = 'statistics',
  STATISTICS_ADDING = 'statistics_adding',
}

interface INameValue {
  name: string;
  value: number;
}

@Component({
  selector: 'app-spider',
  templateUrl: './spider.component.html',
  styleUrls: ['./spider.component.css']
})
export class SpiderComponent implements OnInit {
  @Input() tournament: ITournament;

  public row: number = null;
  public column: number = null;
  public selMatch: IMatch = null;
  public selTeam: number = null;

  private tournamentRegistrations: ITournamentRegistrations[];
  private teams: ITeam[];
  private users: IUser[];
  public matches: IMatch[];
  private matchEvents: IMatchEvent[];

  public selMatch1: string;
  public selMatch2: string;

  public selScorer: string;
  public selAssister: string;

  public showMsg: boolean;
  public msg: string;
  public msgColor: string;

  constructor(
    private userService: UserService,
    private teamService: TeamService,
    private matchService: MatchService,
    private matchEventService: MatchEventService,
    private tournamentRegService: TournamentRegistrationService,
    private tournamentService: TournamentService,
    private router: Router,
  ) {

    this.tournamentRegistrations = [];
    this.users = [];
    this.teams = [];
    this.matches = null;
    this.matchEvents = [];

    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';
  }

  ngOnInit() {
    if (this.tournament === null) {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
      return;
    }

    this.tournamentRegService.getRegisterations(this.tournament.id)
    .then((trs: ITournamentRegistrations[]) => {
      this.tournamentRegistrations = trs;
    })
    .catch(() => {
      this.tournamentRegistrations = [];
    });

    this.matchService.getMatches(this.tournament.id)
    .then((ms: IMatch[]) => {
      this.matches = ms;
    })
    .catch(() => {
      this.matches = [];
    });

    this.teams = this.teamService.getTeams;
    this.users = this.userService.getUsers;
  }

  public selectMatch(row: number, column: number, match: IMatch): void {
    this.row = Number(row);
    this.column = Number(column);
    this.selMatch = match;

    this.selTeam = null;
    this.selScorer = null;
    this.selAssister = null;

    if (this.selMatch !== null && this.selMatch !== undefined) {
      this.matchEventService.getMatchEvents(this.selMatch.id)
      .then((matchEvents: IMatchEvent[]) => {
        this.matchEvents = matchEvents;
      })
      .catch(() => {
        this.matchEvents = [];
      });
    }
  }

  public getCurrUser(): IUser {
    return this.userService.getLoggedData;
  }

  public whatToShow(): whatToShow {
    const user: IUser = this.getCurrUser();

    if (user === null) {
      return whatToShow.STATISTICS;
    }

    if (this.tournament.created === null) {
      return whatToShow.NOTHING;
    }

    if (this.tournament.created === false && this.tournament.creator_id === user.id && this.selMatch !== null) {
      return whatToShow.MATCH_ADDED;
    }

    if (this.tournament.created === false && this.tournament.creator_id === user.id) {
      return whatToShow.MATCH_ADDING;
    }

    if (this.tournament.created === false && this.tournament.referee_id === user.id) {
      return whatToShow.STATISTICS;
    }

    if (this.tournament.created === false && this.tournament.creator_id !== user.id && this.tournament.referee_id !== user.id) {
      return whatToShow.STATISTICS;
    }

    if (this.tournament.created === true && this.tournament.referee_id === user.id) {
      return whatToShow.STATISTICS_ADDING;
    }

    return whatToShow.STATISTICS;
  }

  public getTeamName(teamID: number): string {
    const team: ITeam = this.teams.find((t: ITeam) => t.id === teamID);

    if (team === undefined) {
      return null;
    }

    return team.name;
  }

  public getTeamShortcut(teamID: number): string {
    const team: ITeam = this.teams.find((t: ITeam) => t.id === teamID);

    if (team === undefined) {
      return '';
    }

    return team.shortcut;
  }

  public getUserName(userID: number): string {
    const user: IUser = this.users.find((u: IUser) => u.id === userID);

    if (user === undefined) {
      return null;
    }

    return user.name;
  }

  public getUserDesc(userID: number): string {
    const user: IUser = this.users.find((u: IUser) => u.id === userID);

    if (user === undefined) {
      return '';
    }

    return user.description;
  }

  /**
   * Rendering of spider
   */
  public getRounds(): string[] {
    const res: string[] = [];
    const nop: number = this.tournament.number_of_players;

    const index: number = numberOfPlayers.indexOf(nop);

    if (index < 0) {
      return res;
    }

    for (let i = 0; i <= index + 1; i++) {
      res.unshift(roundNames[i]);
    }

    return res;
  }

  public getMatches(column: number): IMatch[] {
    const nop: number = this.tournament.number_of_players;
    const res: IMatch[] = [];
    const delimeter: number = Math.pow(2, column);
    let calc: number = ((nop / delimeter) / 2) - 1;
    const columnMatches: IMatch[] = (this.matches === null) ? [] : this.matches.filter((m: IMatch) => m.column === column);

    while (calc >= 0) {
      const match: IMatch = columnMatches.find((m: IMatch) => m.row === calc);
      if (match === undefined) {
        res.unshift(null);
      } else {
        let name1 = null;
        let name2 = null;
        if (this.tournament.team_type === ITeamType.PvP) {
          name1 = this.getUserName(match.user1);
          name2 = this.getUserName(match.user2);
        } else {
          name1 = this.getTeamName(match.team1);
          name2 = this.getTeamName(match.team2);
        }

        if (name1 === null || name2 === null) {
          res.unshift(null);
          continue;
        }

        match.name1 = name1;
        match.name2 = name2;

        res.unshift(match);
      }

      calc--;
    }

    return res;
  }

  private getAvalaibleTeams(): INameValue[] {
    const result: INameValue[] = [];

    for (const tr of this.tournamentRegistrations) {
      // Skip referees and teams
      if (tr.allowed === false || tr.referee === true || tr.team_id === null) {
        continue;
      }

      // Check if match with that given user already exist and skip him
      if (this.matches !== null) {
        const index: number = this.matches.findIndex((m: IMatch) => m.team1 === tr.team_id || m.team2 === tr.team_id);

        if (index >= 0) {
          continue;
        }
      }

      const teamName: string = this.getTeamName(tr.team_id);

      if (teamName === null) {
        continue;
      }

      result.push({
        name: teamName,
        value: tr.team_id,
      });
    }

    return result;
  }

  private getAvalaibleUsers(): INameValue[] {
    const result: INameValue[] = [];

    for (const tr of this.tournamentRegistrations) {
      // Skip referees and teams
      if (tr.allowed === false || tr.referee === true || tr.user_id === null) {
        continue;
      }

      // Check if match with that given user already exist and skip him
      if (this.matches !== null) {
        const index: number = this.matches.findIndex((m: IMatch) => m.user1 === tr.user_id || m.user2 === tr.user_id);

        if (index >= 0) {
          continue;
        }
      }

      const userName: string = this.getUserName(tr.user_id);

      if (userName === null) {
        continue;
      }

      result.push({
        name: userName,
        value: tr.user_id,
      });
    }
    return result;
  }

  public get getAvalaiblePlayers(): INameValue[] {
    if (this.tournament.team_type === ITeamType.PvP) {
      return this.getAvalaibleUsers();
    } else {
      return this.getAvalaibleTeams();
    }
  }

  public closeMessage(): void {
    this.showMsg = false;
  }

  public addMatch(pl1: string, pl2: string): void {
    this.showMsg = false;

    if (pl1 === '' || pl2 === '') {
      this.showMsg = true;
      this.msg = 'Please fill out the selections.';
      this.msgColor = RED;
      return;
    }

    if (pl1 === pl2) {
      this.showMsg = true;
      this.msg = 'Same teams cant play agains each other, please select different.';
      this.msgColor = RED;
      return;
    }



    const usr1: number = (this.tournament.team_type === ITeamType.PvP) ? Number(pl1) : null;
    const usr2: number = (this.tournament.team_type === ITeamType.PvP) ? Number(pl2) : null;
    const tm1: number = (this.tournament.team_type !== ITeamType.PvP) ? Number(pl1) : null;
    const tm2: number = (this.tournament.team_type !== ITeamType.PvP) ? Number(pl2) : null;

    this.matchService.addMatch(
      this.tournament.id,
      usr1,
      usr2,
      tm1,
      tm2,
      this.row,
      this.column
    )
    .then(() => {
      this.matchService.getMatches(this.tournament.id)
      .then((ms: IMatch[]) => {
        this.matches = ms;
      })
      .catch(() => {
        this.matches = [];
      });
      this.selMatch1 = null;
      this.selMatch2 = null;
      this.selMatch = null;
      this.row = null;
      this.column = null;

      this.showMsg = true;
      this.msg = 'Match has been added.';
      this.msgColor = GREEN;
    })
    .catch(() => {
      this.showMsg = true;
      this.msg = 'There was a problem while trying to add match. Try again.';
      this.msgColor = RED;
    });
  }

  public deleteMatch(matchID: number): void {
    this.matchService.deleteMatch(matchID)
    .then(() => {
      this.matchService.getMatches(this.tournament.id)
      .then((ms: IMatch[]) => {
        this.matches = ms;
      })
      .catch(() => {
        this.matches = [];
      });
      this.selMatch1 = null;
      this.selMatch2 = null;
      this.selMatch = null;
      this.row = null;
      this.column = null;
      this.selTeam = null;

      this.showMsg = true;
      this.msg = 'Match has been deleted.';
      this.msgColor = GREEN;
    })
    .catch(() => {
      this.showMsg = true;
      this.msg = 'There was a problem while trying to delete match. Try again.';
      this.msgColor = RED;
    });
  }

  public get canStartTournament(): boolean {
    return this.matches.length === (this.tournament.number_of_players / 2);
  }

  public startTounament(): void {
    if (this.canStartTournament === false) {
      this.showMsg = true;
      this.msg = 'Tournament cant be started yet. Please add all matches first.';
      this.msgColor = RED;
      return;
    }

    this.tournamentService.startTournament(this.tournament.id)
    .then(() => {
      this.tournamentService.getTournament(this.tournament.id)
      .then((t: ITournament) => {
        this.tournament = t;
      })
      .catch(() => {
        this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
      });
      this.showMsg = true;
      this.msg = 'Tournament has started.';
      this.msgColor = GREEN;
    })
    .catch(() => {
      this.showMsg = true;
      this.msg = 'There was a problem while trying start a tournament. Try again.';
      this.msgColor = RED;
    });
  }

  public listStatistics(): IMatchEvent[] {
    const res: IMatchEvent[] = [];

    for (const me of this.matchEvents) {
      if (me.team_id == null) {
        me.team_name = '';
      } else {
        me.team_name = this.getTeamName(me.team_id);
      }

      if (me.scorer_id == null) {
        me.scorer_name = '';
      } else {
        me.scorer_name = this.getUserName(me.scorer_id);
      }

      if (me.assister_id == null) {
        me.assister_name = '';
      } else {
        me.assister_name = this.getUserName(me.assister_id);
      }

      res.push(me);
    }
    return res;
  }

  public getMatchUsers(): INameValue[] {
    const res: INameValue[] = [];

    if (this.selMatch === null || this.selMatch === undefined) {
      return res;
    }

    if (this.selMatch.user1 !== null && this.selMatch.user2 !== null) {
      res.push({
        name: this.getUserName(this.selMatch.user1),
        value: this.selMatch.user1,
      });

      res.push({
        name: this.getUserName(this.selMatch.user2),
        value: this.selMatch.user2,
      });
    }

    if (this.selMatch.team1 === null && this.selMatch.team2 === null) {
      return res;
    }

    if (this.selTeam === null) {
      return res;
    }

    const teamUsers: IUser[] = this.users.filter((u: IUser) => u.team === this.selTeam);

    for (const tu of teamUsers) {
      res.push({
        name: tu.name,
        value: tu.id,
      });
    }

    return res;
  }

  public addEvent(): void {
    console.log(this.selMatch);
    this.showMsg = false;

    if (this.tournament.team_type === ITeamType.PvP &&
      (this.selMatch === null || this.selTeam !== null || this.selScorer === null || this.selAssister !== null)) {
      this.selTeam = null;
      this.selAssister = null;
      this.selScorer = null;
      this.selMatch = null;

      this.msg = 'Selected value is wrong, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
      return;
    }

    if (this.tournament.team_type !== ITeamType.PvP &&
      (this.selMatch === null || this.selTeam === null || this.selScorer === null)) {
      this.selTeam = null;
      this.selAssister = null;
      this.selScorer = null;
      this.selMatch = null;

      this.msg = 'Selected value is wrong, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
      return;
    }

    const matchID: number = Number(this.selMatch.id);
    const teamID: number = (this.selTeam === null) ? null : Number(this.selTeam);
    const scorerID: number = Number(this.selScorer);
    const assisterID: number = (this.selAssister === null) ? null : Number(this.selAssister);

    if (scorerID === assisterID) {
      this.msg = 'Scorer and assister can`t be the same person.';
      this.msgColor = RED;
      this.showMsg = true;
      return;
    }

    this.matchEventService.addMatchEvent(
      this.tournament.id,
      matchID,
      teamID,
      scorerID,
      assisterID,
    )
    .then(() => {
      this.matchEventService.getMatchEvents(matchID)
      .then((mes: IMatchEvent[]) => {
        this.matchEvents = mes;
      })
      .catch(() => {
        this.matchEvents = [];
      });

      this.matchService.getMatches(this.tournament.id)
      .then((ms: IMatch[]) => {
        this.matches = ms;

        if (this.selMatch !== null) {
          const match: IMatch = ms.find((m: IMatch) => m.id === this.selMatch.id);

          if (match !== null) {
            this.selMatch = match;
          }
        }
      })
      .catch(() => {
        this.matches = [];
      });

      this.selTeam = null;
      this.selScorer = null;
      this.selAssister = null;

      this.msg = 'Match event added.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
      return;
    });
  }

  public deleteMatchEvent(matchEventID: number): void {
    this.matchEventService.deleteMatchEvent(matchEventID)
    .then(() => {
      if (this.selMatch !== null) {
        this.matchEventService.getMatchEvents(this.selMatch.id)
        .then((mes: IMatchEvent[]) => {
          this.matchEvents = mes;
        })
        .catch(() => {
          this.matchEvents = [];
        });
      }

      this.matchService.getMatches(this.tournament.id)
      .then((ms: IMatch[]) => {
        this.matches = ms;
        if (this.selMatch !== null) {
          const match: IMatch = ms.find((m: IMatch) => m.id === this.selMatch.id);

          if (match !== null) {
            this.selMatch = match;
          }
        }
      })
      .catch(() => {
        this.matches = [];
      });
      this.msg = 'Match event removed.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public endMatch(): void {
    this.showMsg = false;
    if (this.selMatch === null) {
      this.msg = 'Please show match before finishing one.';
      this.msgColor = RED;
      this.showMsg = true;
      return;
    }

    this.matchService.endMatch(this.tournament.id, this.selMatch.id)
    .then(() => {
      this.matchService.getMatches(this.tournament.id)
      .then((ms: IMatch[]) => {
        this.matches = ms;

        if (this.selMatch !== null) {
          const match: IMatch = ms.find((m: IMatch) => m.id === this.selMatch.id);

          if (match !== null) {
            this.selMatch = match;
          }
        }
      })
      .catch(() => {
        this.matches = [];
      });
      this.msg = 'Match ended.';
      this.msgColor = GREEN;
      this.showMsg = true;
    })
    .catch(() => {
      this.msg = 'There was a problem, please try again.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public getLogoFromMatch(match: IMatch, first: boolean): string {
    if (this.tournament.team_type === ITeamType.PvP) {
      return '';
    }
    const teamID: number = (first === true) ? match.team1 : match.team2;

    const team: ITeam = this.teams.find((t: ITeam) => t.id === teamID);

    if (team === null) {
      return this.teamService.getTeamLogo('undefined');
    }

    return this.teamService.getTeamLogo(team.file_name);
  }
}
