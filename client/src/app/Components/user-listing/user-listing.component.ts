import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-listing',
  templateUrl: './user-listing.component.html',
  styleUrls: ['./user-listing.component.css']
})
export class UserListingComponent implements OnInit {

  constructor(
    private userService: UserService,
    private router: Router
    ) { }

  ngOnInit() {
  }

  public get listUsers(): IUser[] {
    return this.userService.getUsers;
  }

  public showUser(userID: number): void {
    this.router.navigate(['show-user'], { queryParams: { id: userID}});
  }

  public get getCurrUser(): IUser {
    return this.userService.getLoggedData;
  }

  public banUser(userID: number): void {
    this.userService.banUser(userID)
    .then(() => {
      this.router.navigate([''], { queryParams: { succ: true, msg: 'User has been banned.', listing: 'user'}});
    })
    .catch(() => {
      this.router.navigate([''], { queryParams:
        { succ: false, msg: 'There was a problem while banning user. Please try again.', listing: 'user'}});
    });
  }

  public unBanUser(userID: number): void {
    this.userService.unBanUser(userID)
    .then(() => {
      this.router.navigate([''], { queryParams: { succ: true, msg: 'User has been unbanned.', listing: 'user'}});
    })
    .catch(() => {
      this.router.navigate([''], { queryParams:
        { succ: false, msg: 'There was a problem while unbanning user. Please try again.', listing: 'user'}});
    });
  }
}
