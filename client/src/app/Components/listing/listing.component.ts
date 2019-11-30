import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectedGREEN, GREEN, RED } from '../../../../../settings/variables';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';

enum Listing  {
    TOURNAMENT = 'tournament',
    TEAM = 'team',
    USER = 'user',
    MYTOURNAMENT = 'mytournament',
}

@Component({
  selector: 'app-listing',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.css']
})
export class ListingComponent implements OnInit, OnDestroy {
  public selectedListing: string;

  public showMsg: boolean;
  public msg: string;
  public msgColor: string;
  private subscription: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {
    this.selectedListing = Listing.TOURNAMENT;
    this.showMsg = false;
    this.subscription = null;
    this.msg = '';
    this.msgColor = '';

    this.subscription = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.handleMessage();
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
    }
  }

  public handleMessage(): void {
    const succ: boolean = this.route.snapshot.queryParams.succ === 'true';
    const msg: string = this.route.snapshot.queryParams.msg;
    const listing: string = this.route.snapshot.queryParams.listing;

    if (listing !== undefined) {
      if (listing === 'tournament') {
        this.selectedListing = Listing.TOURNAMENT;
      } else if (listing === 'team') {
        this.selectedListing = Listing.TEAM;
      } else if (listing === 'user') {
        this.selectedListing = Listing.USER;
      } else if (listing === 'mytournament') {
        this.selectedListing = Listing.MYTOURNAMENT;
      } else {
        this.selectedListing = Listing.TOURNAMENT;
      }
    }

    if (succ === undefined || msg === undefined) {
      this.showMsg = false;
      return;
    }

    if (succ === true) {
      this.msgColor = GREEN;
    } else {
      this.msgColor = RED;
    }

    this.msg = msg;
    this.showMsg = true;
  }

  public closeMessage(): void {
    this.showMsg = false;
  }

  public get getCurrData(): IUser {
    return this.userService.getLoggedData;
  }
}
