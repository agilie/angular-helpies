import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TestComponent} from './test.component';

describe('unsubscribable decorator', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestComponent
      ]
    });
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
  });

  it('should unsubscribe active subscriptions when component is destroyed', () => {
    fixture.detectChanges();
    spyOn(component.myObservable, 'unsubscribe');
    fixture.destroy();
    expect(component.myObservable.unsubscribe).toHaveBeenCalled();
  });

  it('should call original ngOnDestroy hook if exists', () => {
    fixture.detectChanges();
    spyOn(component, 'ngOnDestroy');
    fixture.destroy();
    expect(component.ngOnDestroy).toHaveBeenCalled();
  });

  it('should leave excluded observables if any', () => {
    fixture.detectChanges();
    spyOn(component.myObservable, 'unsubscribe');
    spyOn(component.excludedObservable, 'unsubscribe');
    fixture.destroy();
    expect(component.myObservable.unsubscribe).toHaveBeenCalled();
    expect(component.excludedObservable.unsubscribe).not.toHaveBeenCalled();
  });


});
