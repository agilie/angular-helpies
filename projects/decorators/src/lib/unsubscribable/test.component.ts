import {Component, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {Unsubscribable} from './unsubscribable.decorator';

@Component({
  selector: 'lib-test',
  template: '',
})
@Unsubscribable()
export class TestComponent implements OnInit {

  myObservable: Subscription;

  ngOnInit() {
    this.myObservable = interval(1000).subscribe();
  }

}
