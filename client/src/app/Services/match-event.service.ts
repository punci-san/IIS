import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { matchEventPage } from '../../../../settings/routes';
import { IMatchEvent } from '../../../../interfaces/match_event';

@Injectable({
  providedIn: 'root'
})
export class MatchEventService {

  constructor(
    private userService: UserService
  ) {}

  public addMatchEvent(
    tournamentID: number,
    matchID: number,
    teamID: number,
    scorerID: number,
    assisterID: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        tournament_id: tournamentID,
        match_id: matchID,
        team_id: teamID,
        scorer_id: scorerID,
        assister_id: assisterID,
      };

      http.open('POST', matchEventPage, true);
      this.userService.addAuthentication(http);
      http.setRequestHeader('Content-Type', 'application/json');

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          return resolve();
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(JSON.stringify(data));
    });
  }

  public getMatchEvents(matchID: number): Promise<IMatchEvent[]> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${matchEventPage}/${matchID}`;

      http.open('GET', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const matchEvents: IMatchEvent[] = JSON.parse(http.responseText);
            return resolve(matchEvents);
          } catch (error) {
            return reject();
          }
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(null);
    });
  }

  public deleteMatchEvent(matchEventID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${matchEventPage}/${matchEventID}`;

      http.open('DELETE', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          return resolve();
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(null);
    });
  }
}
