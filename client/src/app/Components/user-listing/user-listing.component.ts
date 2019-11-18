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
}
