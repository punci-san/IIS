import { Injectable } from '@angular/core';
import { IMatch } from '../../../../interfaces/match';
import { matchPage } from '../../../../settings/routes';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  constructor(
    private userService: UserService,
  ) { }

  public addMatch(
    tournamentID: number,
    user1: number,
    user2: number,
    team1: number,
    team2: number,
    row: number,
    column: number,
    system: boolean = false
  ) {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        user_1: user1,
        user_2: user2,
        team_1: team1,
        team_2: team2,
        row,
        column,
      };

      const http = new XMLHttpRequest();
      http.open('POST', matchPage, true);
      http.setRequestHeader('Content-Type', 'application/json');
      if (system) {
        http.setRequestHeader('System', 'system');
      } else {
        this.userService.addAuthentication(http);
      }

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

  public getMatches(tournamentID: number): Promise<IMatch[]> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${matchPage}/${tournamentID}`;
      http.open('GET', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const res: IMatch[] = JSON.parse(http.responseText);
            return resolve(res);
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

  public deleteMatch(matchID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${matchPage}/${matchID}`;
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
