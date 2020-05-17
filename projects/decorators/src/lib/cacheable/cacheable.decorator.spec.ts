import {Cacheable} from './cacheable.decorator';
import {async} from '@angular/core/testing';
import {timer} from 'rxjs';
import {map} from 'rxjs/operators';

class TestClass {

  @Cacheable()
  simpleValue() {
    return this.dataProvider();
  }

  @Cacheable()
  promiseValue() {
    return timer(1000).toPromise()
      .then(() => this.dataProvider());
  }

  @Cacheable()
  observableValue() {
    return timer(1000)
      .pipe(
        map(() => this.dataProvider())
      );
  }

  dataProvider() {
    return true;
  }

}

describe('cacheable decorator', () => {

  let testClass: TestClass;
  beforeEach(() => {
    testClass = new TestClass();
  });

  it('should cache simple functions', async(() => {
    spyOn(testClass, 'dataProvider').and.callThrough();

    const result1 = testClass.simpleValue();

    expect(result1).toBeTruthy();

    const result2 = testClass.simpleValue();
    expect(result2).toBeTruthy();

    expect(testClass.dataProvider).toHaveBeenCalledTimes(1);
  }));

  it('should cache promise functions', async(() => {
    spyOn(testClass, 'dataProvider').and.callThrough();

    testClass.observableValue().subscribe(result1 => {
      expect(result1).toBeTruthy();

      testClass.observableValue().subscribe(result2 => {
        expect(result2).toBeTruthy();

        expect(testClass.dataProvider).toHaveBeenCalledTimes(1);
      });
    });
  }));

});
