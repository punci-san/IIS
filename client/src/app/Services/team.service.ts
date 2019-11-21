import { Injectable } from '@angular/core';
import {
  teamPage,
  teamRequestPage,
  teamRequestDenyPage,
  teamRequestAcceptPage,
  teamKickPage,
  teamAdminPage } from '../../../../settings/routes';
import { UserService } from './user.service';
import { timeout } from '../../../../settings/variables';
import { ITeam, ITeamRequest } from '../../../../interfaces/team';
import { IUser } from '../../../../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teams: ITeam[];
  private filteredTeams: ITeam[];
  private currFilter: string;

  constructor(
    private userService: UserService
  ) {
    this.teams = [];
    this.filteredTeams = [];
    this.currFilter = '';

    this.loadTeams();

    setInterval(() => {
      this.loadTeams();
    }, timeout);
  }

  public get getTeams(): ITeam[] {
    return this.filteredTeams;
  }

  public getTeam(id: number): Promise<ITeam> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${teamPage}/${id}`;

      http.open('GET', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const team: ITeam = JSON.parse(http.responseText);
            return resolve(team);
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

  public addTeam(name: string, file: FileList): Promise<any> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();

      const data = {
        team: name
      };

      http.open('POST', teamPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const usr: IUser = JSON.parse(http.responseText);
            this.userService.saveLoggedData(usr);
            this.loadTeams();
            return resolve();
          } catch (error) {
            return resolve();
          }

        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(JSON.stringify(data));
    });
  }

  private loadTeams(): void {
    const http = new XMLHttpRequest();
    http.open('GET', teamPage, true);
    http.onreadystatechange = () => {
      if (http.readyState === 4 && http.status === 200) {
        try {
          this.teams = JSON.parse(http.responseText);
          this.filterTeams(this.currFilter);
        } catch (error) {
          this.teams = [];
        }
      }
    };
    http.send(null);
  }

  public filterTeams(filter: string): void {
    const filt: string = filter.toUpperCase();
    this.currFilter = filter;

    this.filteredTeams = [];

    for (const team of this.teams) {
      const a: string = team.name.toUpperCase();
      if (a.includes(filt)) {
        this.filteredTeams.push(team);
      }
    }
  }

  public deleteTeam(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${teamPage}/${id}`;
      http.open('DELETE', page, true);
      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          this.loadTeams();
          return resolve();
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };
      http.send(null);
    });
  }

  public kickUser(userID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        team_id: teamID,
        user_id: userID,
      };

      http.open('POST', teamKickPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

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

  public makeTeamLeader(teamID: number, userID: number): Promise<ITeam> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();

      const data = {
        team_id: teamID,
        user_id: userID,
      };

      http.open('POST', teamAdminPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const team: ITeam = JSON.parse(http.responseText);
            return resolve(team);
          } catch (error) {
          return reject();
          }
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(JSON.stringify(data));
    });
  }

  public getTeamRequests(teamID?: number): Promise<ITeamRequest[]> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();

      let page = `${teamRequestPage}`;

      if (teamID !== undefined) {
        page = `${teamRequestPage}/${teamID}`;
      }

      http.open('GET', page, true);

      this.userService.addAuthentication(http);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const teamRequests: ITeamRequest[] = JSON.parse(http.responseText);
            return resolve(teamRequests);
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

  public joinTeam(userID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        user_id: userID,
        team_id: teamID,
      };

      http.open('POST', teamRequestPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

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

  public acceptTeamJoin(teamRequestID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        id: teamRequestID,
        team_id: teamID,
      };

      http.open('POST', teamRequestAcceptPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

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

  public denyTeamJoin(teamRequestID: number, teamID: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const data = {
        id: teamRequestID,
        team_id: teamID,
      };

      http.open('POST', teamRequestDenyPage, true);
      http.setRequestHeader('Content-Type', 'application/json');

      this.userService.addAuthentication(http);

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
