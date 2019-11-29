import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/Services/user.service';
import { Router } from '@angular/router';
import { numberOfPlayers, teamType } from '../../../../../settings/tournament_config';
import { RED, maxCharLen } from '../../../../../settings/variables';
import { TournamentService } from 'src/app/Services/tournament.service';

@Component({
  selector: 'app-add-tournament',
  templateUrl: './add-tournament.component.html',
  styleUrls: ['./add-tournament.component.css']
})
export class AddTournamentComponent implements OnInit {
  public numberOfPlayers: number[];
  public tournamentType: string[];

  private showMsg: boolean;
  private msg: string;
  private msgColor: string;

  constructor(
    private userService: UserService,
    private router: Router,
    private tournamentService: TournamentService,
  ) {
    this.numberOfPlayers = numberOfPlayers;
    this.tournamentType = teamType;

    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';
  }

  ngOnInit() {
    if (this.userService.getLoggedData === null) {
      return this.router.navigate(['user-log_reg'], { queryParams: { succ: false, msg: 'You need to be logged in to add tournament.'}});
    }
  }

  public getCurrentDate(): string {
    const date: Date = new Date();
    const day = date.getUTCDate().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${day}`;
  }

  public addTournament(
    name: string,
    numOfPlayers: string,
    tournamentType: string,
    registerFee: string,
    description: string,
    tournamentStart: string,
    sponsors: string,
    ): void {
      this.showMsg = false;

      if (name === '') {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Name needs to be filled!';
        return;
      }

      if (name.length > maxCharLen || name.length < 1) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = `Name needs to be between 1 and ${maxCharLen}`;
        return;
      }

      if (description !== '' && (description.length > maxCharLen || description.length < 1)) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = `Description needs to be between 1 and ${maxCharLen}`;
        return;
      }

      if (sponsors !== '' && (sponsors.length > maxCharLen || sponsors.length < 1)) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = `Sponsors needs to be between 1 and ${maxCharLen}`;
        return;
      }

      if (tournamentStart === '') {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Tournament start date needs to be filled!';
        return;
      }

      const nop: number = Number(numOfPlayers);
      const fee: number = Number(registerFee);
      const tourType: number = Number(tournamentType);
      const startDate: Date = new Date(tournamentStart);

      if (isNaN(nop) || isNaN(fee) || isNaN(tourType)) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Please check register fee and try again!';
        return;
      }

      if (fee < 0) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Please check register fee and try again!';
        return;
      }

      if (this.numberOfPlayers.includes(nop) === false) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Please check number of players and try again!';
        return;
      }

      if (tourType < 0 || tourType >= this.tournamentType.length) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Please check tournament type and try again!';
        return;
      }

      const date: Date = new Date();

      if (startDate.getDate() < date.getDate() || startDate.getMonth() < date.getMonth() || startDate.getFullYear() < date.getFullYear()) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Date cant be lower than today!';
        return;
      }

      this.tournamentService.addTournament(name, nop, tourType, fee, description, startDate, sponsors)
      .then(() => {
        this.router.navigate([''], { queryParams: { succ: true, msg: 'Tournament have been successfully created.'}});
      })
      .catch(() => {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'There was an error with creating tournament, please try again.';
      });
  }

  public closeMessage(): void {
    this.showMsg = false;
  }
}
