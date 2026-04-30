import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {Unsubscribable} from './unsubscribable.decorator';

@Component({
    selector: 'lib-test',
    template: '',
    standalone: false
})
@Unsubscribable({exclude: ['excludedObservable']})
export class TestComponent implements OnInit, OnDestroy {

  myObservable: Subscription;
  excludedObservable: Subscription;
  /** Set by tests that assert user `ngOnDestroy` runs through decorator */
  userNgOnDestroyRan = false;

  ngOnInit() {
    this.myObservable = interval(1000).subscribe();
    this.excludedObservable = interval(1000).subscribe();
  }

  ngOnDestroy() {
    this.userNgOnDestroyRan = true;
  }

}
