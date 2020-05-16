import {TestBed} from '@angular/core/testing';
import {TestComponent} from './test.component';

describe('unsubscribable decorator', () => {
  beforeEach(() => TestBed.configureTestingModule({
    declarations: [
      TestComponent
    ]
  }));

  it('should unsubscribe active subscriptions when component is destroyed', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    spyOn(component.myObservable, 'unsubscribe');
    fixture.destroy();
    expect(component.myObservable.unsubscribe).toHaveBeenCalled();
  });

  it('should call original ngOnDestroy hook if exists', () => {

  });

  it('should leave excluded observables if any', () => {

  });


});
