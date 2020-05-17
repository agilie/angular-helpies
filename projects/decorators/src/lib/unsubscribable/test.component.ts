import {Component, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {Unsubscribable} from './unsubscribable.decorator';

@Component({
  selector: 'lib-test',
  template: '',
})
@Unsubscribable({exclude: ['excludedObservable']})
export class TestComponent implements OnInit, OnDestroy {

  myObservable: Subscription;
  excludedObservable: Subscription;

  ngOnInit() {
    this.myObservable = interval(1000).subscribe();
    this.excludedObservable = interval(1000).subscribe();
  }

  ngOnDestroy() {
  }

}
