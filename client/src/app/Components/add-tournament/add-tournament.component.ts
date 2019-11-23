import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/Services/user.service';
import { Router } from '@angular/router';
import { numberOfPlayers, teamType } from '../../../../../settings/tournament_config';
import { RED, maxCharVal } from '../../../../../settings/variables';
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
    tournamentStart: Date,
    sponsors: string,
    ): void {
      this.showMsg = false;
      if (name === '' || registerFee === '') {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Name and registration fee needs to be filled!';
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

      if (startDate.getDate() < new Date().getDate()) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = 'Please select new date!';
        return;
      }

      if (name.length > maxCharVal) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = `Too many characters in name, the limit is ${maxCharVal}`;
        return;
      }

      if (description.length > maxCharVal) {
        this.showMsg = true;
        this.msgColor = RED;
        this.msg = `Too many characters in description, the limit is ${maxCharVal}`;
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
