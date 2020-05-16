import {Observable, Subscription, timer} from 'rxjs';
import {Blockable} from './blockable.decorator';
import {map} from 'rxjs/operators';
import {async} from '@angular/core/testing';

class TestClass {

  @Blockable()
  promise() {
    return timer(1000)
      .pipe(map(() => true))
      .toPromise();
  }

  @Blockable()
  observable() {
    return timer(1000)
      .pipe(map(() => true));
  }

}

describe('blockable decorator', () => {

  let testClass: TestClass;
  beforeEach(() => {
    testClass = new TestClass();
  });

  it('should prevent Promise based function from calling twice', async(() => {
    const result1 = testClass.promise();
    const result2 = testClass.promise();
    expect(result1 instanceof Promise).toBeTruthy();
    expect(result2).toBeUndefined();
    result1.then(res => {
      expect(res).toBeTruthy();
    });
  }));

  it('should prevent Observable based function from calling twice', async(() => {
    const result1 = testClass.observable().subscribe(res => {
      expect(res).toBeTruthy();
    });
    const result2 = testClass.observable();
    expect(result1 instanceof Subscription).toBeTruthy();
    expect(result2).toBeUndefined();
  }));

});
