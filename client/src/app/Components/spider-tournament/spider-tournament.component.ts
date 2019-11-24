import { Component, OnInit, Input } from '@angular/core';
import { ITournament } from '../../../../../interfaces/tournament';

@Component({
  selector: 'app-spider-tournament',
  templateUrl: './spider-tournament.component.html',
  styleUrls: ['./spider-tournament.component.css']
})
export class SpiderTournamentComponent implements OnInit {
  @Input() tournament: ITournament;

  constructor() {}

  ngOnInit() {
  }

}
