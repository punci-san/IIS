import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private currFilter: string;

  constructor() {
    this.currFilter = '';
  }

  public filterMatches(filter: string): void {
    this.currFilter = filter;
  }
}
