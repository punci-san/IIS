import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { tournamentRegistrationPage } from '../../../../settings/routes';
import { ITournamentRegistrations } from '../../../../interfaces/tournament-registrations';

@Injectable({
  providedIn: 'root'
})
export class TournamentRegistrationService {

  constructor(
    private userService: UserService,
  ) { }

  public registerAsReferee(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
        referee: true,
      };

      http.open('POST', tournamentRegistrationPage, true);
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

  public registerAsTeam(tournamentID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        tournament_id: tournamentID,
        team_id: teamID,
      };

      http.open('POST', tournamentRegistrationPage, true);
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

  public registerAsUser(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
      };

      http.open('POST', tournamentRegistrationPage, true);
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


  public getRegisterations(tournamentID?: number): Promise<ITournamentRegistrations[]> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();

      let page = `${tournamentRegistrationPage}`;

      if (tournamentID !== undefined) {
        page += `/${tournamentID}`;
      }

      http.open('GET', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const trs: ITournamentRegistrations[] = JSON.parse(http.responseText);
            return resolve(trs);
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
}
