import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';

export type FuncType = 'observable' | 'promise' | 'value';

export interface CacheOptions {
  lifetime: number;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  lifetime: null
};

export function Cacheable(options: Partial<CacheOptions>): MethodDecorator {

  let cachedValue: any;
  let funcType: FuncType;
  let inProgress = false;
  let result: Promise<any> | Observable<any> | any;

  return (target: object, key: string | symbol, descriptor: PropertyDescriptor): void => {
    const method = descriptor.value;

    descriptor.value = (...args) => {

      if (cachedValue) {
        switch (funcType) {
          case 'observable':
            return of(cachedValue);
          case 'promise':
            return Promise.resolve(cachedValue);
          default:
            return cachedValue;
        }
      }

      if (inProgress) {
        return result;
      }
      inProgress = true;
      result = method.apply(this, args);
      switch (true) {
        case result instanceof Observable:
          funcType = 'observable';
          return result.pipe(
            tap(val => {
              putCache(val);
              inProgress = false;
            }));
        case result instanceof Promise:
          funcType = 'promise';
          return result
            .then(value => {
              putCache(value);
              inProgress = false;
              return value;
            });
        default:
          funcType = 'value';
          putCache(result);
          inProgress = false;
          return result;
      }
    };
  };

  function putCache(value) {
    cachedValue = value;
  }
}
