import { Component, OnInit, Input } from '@angular/core';
import { ITournament } from '../../../../../interfaces/tournament';
import { ITournamentRegistrations } from '../../../../../interfaces/tournament-registrations';
import { TournamentRegistrationService } from 'src/app/Services/tournament-registration.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-spider-tournament',
  templateUrl: './spider-tournament.component.html',
  styleUrls: ['./spider-tournament.component.css']
})
export class SpiderTournamentComponent implements OnInit {
  @Input() tournament: ITournament;
  private tournamentRegistrations: ITournamentRegistrations[];

  constructor(
    private tournamentRegService: TournamentRegistrationService,
    private router: Router,
  ) {
    this.tournamentRegistrations = [];
  }

  ngOnInit() {
    if (this.tournament === null) {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
      return;
    }

    this.tournamentRegService.getRegisterations(this.tournament.id)
    .then((tr: ITournamentRegistrations[]) => {
      this.tournamentRegistrations = tr;
    })
    .catch(() => {
      this.router.navigate([''], { queryParams: { succ: false, msg: 'Given tournament does not exist', listing: 'tournament'}});
    });
  }

}
