import { Injectable } from '@angular/core';
import { IUserStatistics, ITeamStatistics } from '../../../../interfaces/statistics';
import { userStatistics, teamStatistics } from '../../../../settings/routes';

@Injectable({
  providedIn: 'root'
})
export class StatisticService {

  constructor() { }

  public getUserStatistic(userID: number): Promise<IUserStatistics> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${userStatistics}/${userID}`;
      http.open('GET', page, true);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const stat: IUserStatistics = JSON.parse(http.responseText);
            return resolve(stat);
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

  public getTeamStatistic(teamID: number): Promise<ITeamStatistics> {
    return new Promise((resolve, reject) => {
      const http = new XMLHttpRequest();
      const page = `${teamStatistics}/${teamID}`;

      http.open('GET', page, true);

      http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
          try {
            const stat: ITeamStatistics = JSON.parse(http.responseText);
            return resolve(stat);
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
