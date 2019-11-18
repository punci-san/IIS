import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectedGREEN, GREEN, RED } from '../../../../../settings/variables';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

enum Listing  {
    MATCH = 'match',
    TEAM = 'team',
    USER = 'user',
}

@Component({
  selector: 'app-listing',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.css']
})
export class ListingComponent implements OnInit, OnDestroy {
  private selectedListing: Listing;
  private selColor: string;
  private defColor: string;

  private showMsg: boolean;
  private msg: string;
  private msgColor: string;
  private subscription: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.selectedListing = Listing.MATCH;
    this.selColor = SelectedGREEN;
    this.defColor = GREEN;

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
      if (listing === 'match') {
        this.selectedListing = Listing.MATCH;
      } else if (listing === 'team') {
        this.selectedListing = Listing.TEAM;
      } else if (listing === 'user') {
        this.selectedListing = Listing.USER;
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
}
