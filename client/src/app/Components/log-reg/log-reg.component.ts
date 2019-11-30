import { Component, OnInit, OnDestroy } from '@angular/core';
import { RED, GREEN, maxUsernameLen, maxCharLen } from '../../../../../settings/variables';
import { UserService } from 'src/app/Services/user.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-log-reg',
  templateUrl: './log-reg.component.html',
  styleUrls: ['./log-reg.component.css']
})
export class LogRegComponent implements OnInit, OnDestroy {
  public showMsg: boolean;
  public msg: string;
  public msgColor: string;
  private subscription: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.subscription = null;
    this.showMsg = false;
    this.msg = '';
    this.msgColor = '';

    this.subscription = this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.handleMessage();
      }
    });
  }

  ngOnInit() {
    if (this.userService.isLoggedIn()) {
      this.router.navigate([''], { queryParams: { succ: true, msg: 'You are already logged in.'}});
    }
  }

  ngOnDestroy() {
    if (this.subscription !== null) {
      this.subscription.unsubscribe();
    }
  }

  public login(user: string, pass: string): void {
    if (user === '' || pass === '') {
      this.showMsg = true;
      this.msg = 'Please fill in the required inputs.';
      this.msgColor = RED;
      return;
    }

    this.userService.login(user, pass)
    .then(() => {
      this.router.navigate([''], { queryParams: { succ: true, msg: 'You have been logged in.'}});
    })
    .catch(() => {
      this.showMsg = true;
      this.msg = 'Username or password is incorrect';
      this.msgColor = RED;
    });
  }

  public register(user: string, pass1: string, pass2: string): void {
    this.showMsg = false;
    if (user === '' || pass1 === '' || pass2 === '') {
      this.showMsg = true;
      this.msg = 'Please fill in the required inputs.';
      this.msgColor = RED;
      return;
    }

    if (pass1 !== pass2) {
      this.showMsg = true;
      this.msg = 'Given passwords do not match.';
      this.msgColor = RED;
      return;
    }

    if (pass1.length < 3 || pass1.length > maxUsernameLen) {
      this.showMsg = true;
      this.msg = `Password needs to be between 3 and ${maxUsernameLen}`;
      this.msgColor = RED;
      return;
    }

    if (user.length < 0 || user.length > maxUsernameLen) {
      this.showMsg = true;
      this.msg = `Username needs to be between 1 and ${maxUsernameLen}`;
      this.msgColor = RED;
      return;
    }

    this.userService.register(user, pass1)
    .then(() => {
      this.showMsg = true;
      this.msg = 'You have been successfully registered. You can login now.';
      this.msgColor = GREEN;
    })
    .catch(() => {
      this.msg = 'Username already exists.';
      this.msgColor = RED;
      this.showMsg = true;
    });
  }

  public closeMessage(): void {
    this.showMsg = false;
  }

  public handleMessage(): void {
    const succ: boolean = this.route.snapshot.queryParams.succ === 'true';
    const msg: string = this.route.snapshot.queryParams.msg;

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
}
