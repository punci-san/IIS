import { Injectable } from '@angular/core';
import { teamPage } from '../../../../settings/routes';
import { UserService } from './user.service';
import { timeout } from '../../../../settings/variables';
import { ITeam } from '../../../../interfaces/team';
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
}
