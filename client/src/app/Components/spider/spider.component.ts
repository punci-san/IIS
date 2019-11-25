import { Component, OnInit, Input } from '@angular/core';
import { ITournament } from '../../../../../interfaces/tournament';
import { UserService } from 'src/app/Services/user.service';
import { IUser } from '../../../../../interfaces/user';

@Component({
  selector: 'app-spider',
  templateUrl: './spider.component.html',
  styleUrls: ['./spider.component.css']
})
export class SpiderComponent implements OnInit {
  @Input() tournament: ITournament;

  public row: number = null;
  public column: number = null;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
  }

  public selectMatch(row: number, column: number): void {
    this.row = Number(row);
    this.column = Number(column);
  }

  public get getCurrUser(): IUser {
    return this.userService.getLoggedData;
  }
}
