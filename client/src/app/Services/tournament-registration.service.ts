import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import {
  tournamentRegistrationPage,
  tournamentRegistrationRefereeAcceptPage,
  tournamentRegistrationRefereeDenyPage,
  tournamentRegAcceptPage,
  tournamentRegDenyPage,
  tournamentRegistrationRefereeClearPage} from '../../../../settings/routes';
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

  public acceptReferee(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
        referee: true,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegistrationRefereeAcceptPage, true);
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

  public denyReferee(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
        referee: true,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegistrationRefereeDenyPage, true);
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

  public clearReferee(tournamentID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegistrationRefereeClearPage, true);
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

  public acceptUser(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegAcceptPage, true);
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

  public denyUser(tournamentID: number, userID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        user_id: userID,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegDenyPage, true);
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

  public acceptTeam(tournamentID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        team_id: teamID,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegAcceptPage, true);
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

  public denyTeam(tournamentID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = {
        tournament_id: tournamentID,
        team_id: teamID,
      };
      const http = new XMLHttpRequest();

      http.open('POST', tournamentRegDenyPage, true);
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
}
