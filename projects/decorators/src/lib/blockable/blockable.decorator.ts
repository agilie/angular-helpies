import {Observable, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';

/**
 * TODO: This decorator should be revised I think
 */
export function Blockable(): MethodDecorator {
  return (target: object, key: string | symbol, descriptor: PropertyDescriptor): void => {

    const method = descriptor.value;
    let isLoading = false;

    descriptor.value = function(...args): any {

      if (isLoading) {
        return;
      }
      isLoading = true;
      const result = method.apply(this, args);
      switch (true) {
        case result instanceof Observable:
          result.pipe(
            tap(
              () => isLoading = false,
              () => isLoading = false
            )
          );
          break;
        case result instanceof Promise:
          result.then(
            () => isLoading = false,
            () => isLoading = false
          );
          break;
        case result instanceof Subscription:
          result.add(
            () => isLoading = false
          );
          break;
        default:
          isLoading = false;
      }
      return result;
    };
  };
}
