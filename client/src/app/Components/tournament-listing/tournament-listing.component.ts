import { Component, OnInit, Input } from '@angular/core';
import { ITournament } from '../../../../../interfaces/tournament';
import { TournamentService } from 'src/app/Services/tournament.service';
import { Router } from '@angular/router';
import { ITournamentRegistrations } from '../../../../../interfaces/tournament-registrations';
import { TournamentRegistrationService } from 'src/app/Services/tournament-registration.service';

@Component({
  selector: 'app-tournament-listing',
  templateUrl: './tournament-listing.component.html',
  styleUrls: ['./tournament-listing.component.css']
})
export class TournamentListingComponent implements OnInit {
  @Input() creatorID: string;

  constructor(
    private tournamentService: TournamentService,
    private router: Router,
  ) { }

  ngOnInit() {
  }

  public get getTournaments(): ITournament[] {
    const tournaments: ITournament[] = this.tournamentService.getTournaments;
    const creatorID: number = Number(this.creatorID);
    if (isNaN(creatorID)) {
      return tournaments;
    }
    const result: ITournament[] = [];

    for (const t of tournaments) {
      if (t.creator_id === creatorID) {
          result.push(t);
      }
    }

    return result;
  }

  public showTournament(tournamentID: number): void {
    this.router.navigate(['show-tournament'], { queryParams: { id: tournamentID}});
  }
}
