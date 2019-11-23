import { Injectable } from '@angular/core';
import { ITournament } from '../../../../interfaces/tournament';
import { timeout } from '../../../../settings/variables';
import { tournamentPage } from '../../../../settings/routes';
import { UserService } from './user.service';


@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private tournaments: ITournament[];
  private filteredTournaments: ITournament[];
  private currFilter: string;

  constructor(
    private userService: UserService,
  ) {
    this.tournaments = [];
    this.filteredTournaments = [];
    this.currFilter = '';

    this.loadTournaments();

    setInterval(() => {
      this.loadTournaments();
    }, timeout);
  }

  private loadTournaments(): void {
    const http = new XMLHttpRequest();
    http.open('GET', tournamentPage, true);

    http.onreadystatechange = () => {
      if (http.readyState === 4 && http.status === 200) {
        try {
          this.tournaments = JSON.parse(http.responseText);
          this.filterTournaments(this.currFilter);
        } catch (error) {
          this.tournaments = [];
        }
      } else if (http.readyState === 4 && http.status !== 200) {
        this.tournaments = [];
      }
    };

    http.send(null);
  }

  public getTournament(tournamentID: number): Promise<ITournament> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${tournamentPage}/${tournamentID}`;
      http.open('GET', page, true);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            return resolve(JSON.parse(http.responseText));
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

  public filterTournaments(filter: string): void {
    const filt: string = filter.toUpperCase();
    this.currFilter = filter;
    this.filteredTournaments = [];

    for (const usr of this.tournaments) {
      const a: string = usr.name.toUpperCase();
      if (a.includes(filt)) {
        this.filteredTournaments.push(usr);
      }
    }
  }

  public get getTournaments(): ITournament[] {
    return this.filteredTournaments;
  }

  public addTournament(
    name: string,
    numOfPlayers: number,
    tournamentType: number,
    registerFee: number,
    description: string,
    tournamentStart: Date,
    sponsors: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();

      const data = {
        name,
        number_of_players: numOfPlayers,
        tournament_type: tournamentType,
        register_fee: registerFee,
        description,
        tournament_start: tournamentStart,
        sponsors,
      };

      http.open('POST', tournamentPage, true);

      this.userService.addAuthentication(http);
      http.setRequestHeader('Content-Type', 'application/json');

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          this.loadTournaments();
          return resolve();
        } else if (http.readyState === 4 && http.status !== 200) {
          return reject();
        }
      };

      http.send(JSON.stringify(data));
    });
  }
}
