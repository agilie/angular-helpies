# Angular Helpies

[![codecov](https://codecov.io/gh/agilie/angular-helpies/branch/master/graph/badge.svg)](https://codecov.io/gh/agilie/angular-helpies)

A small set of utilities for Angular apps: an **HTTP interceptor** that deduplicates identical in-flight requests and **decorators** for component/service methods and classes (blocking duplicate calls, `ngOnDestroy` cleanup, simple caching).

This repo is an **Angular CLI monorepo**. It builds **two separate npm packages** with `ng-packagr`, published under the `@agilie/angular-helpies` scope.

---

## Packages

| Package | npm name | Contents |
|---------|----------|----------|
| Interceptors | `@agilie/angular-helpies/interceptors` | `DuplicateRequestFilter` |
| Decorators | `@agilie/angular-helpies/decorators` | `Blockable`, `Unsubscribable`, `Cacheable`, empty `DecoratorsModule` |

The root `package.json` name (`@agilie/angular-helpies`) is the **development workspace**; consumers usually install the subpackages from the table.

---

## Requirements

- **Angular** with `@angular/common/http` (for the interceptor).
- **RxJS** 6+ / 7+ (same as in your app).

`projects/interceptors/package.json` and `projects/decorators/package.json` still declare legacy **`peerDependencies`** (`^8.2.14`). This workspace targets a **current Angular** version (see root dependencies). Before publishing, consider **bumping `peerDependencies`** to match the Angular versions you actually support.

---

## Installation

```bash
npm install @agilie/angular-helpies/interceptors
npm install @agilie/angular-helpies/decorators
```

---

## `@agilie/angular-helpies/interceptors`

### `DuplicateRequestFilter`

Implements `HttpInterceptor`: **parallel identical HTTP requests** share the **same** response `Observable` (via `share()`) until the request finishes with success (`HttpResponse`) or error (`HttpErrorResponse`). Identity is computed as:

`method + urlWithParams + serializeBody()`

Same **method**, **URL including query**, **same body** → one network round trip; subscribers share the result.

#### Wiring (standalone, recommended)

```typescript
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DuplicateRequestFilter } from '@agilie/angular-helpies/interceptors';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    DuplicateRequestFilter,
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DuplicateRequestFilter,
      multi: true,
    },
  ],
});
```

#### Wiring (`NgModule`)

```typescript
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DuplicateRequestFilter } from '@agilie/angular-helpies/interceptors';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    DuplicateRequestFilter,
    { provide: HTTP_INTERCEPTORS, useClass: DuplicateRequestFilter, multi: true },
  ],
})
export class AppModule {}
```

The interceptor does **not** deduplicate a **new** request after the first one has completed: the in-flight entry is removed after success or error.

---

## `@agilie/angular-helpies/decorators`

Exports TypeScript decorator functions plus a stub module.

### `Blockable()` (method)

The decorator applies to **class methods** — whether on a **component**, **service**, or plain TS class. Angular is irrelevant; you need `experimentalDecorators` in `tsconfig` and calls like `this.save()`.

In practice it is most often used on **component** methods (Save button, form submit). Moving the same logic to a **service** is fine too — with `providedIn: 'root'` you typically have a single service instance, so behavior stays sensible.

**Implementation detail:** the in-flight flag (`isLoading`) lives in **one closure per class + method name**, so it is **shared across all instances of that class**. While any instance is inside the “blocked” call, **another instance of the same class** will also get `undefined` if it calls the same method. That is usually fine for a **single** component instance on screen or a **singleton** service; it may be wrong if **several** instances of the same component are visible at once.

Blocks **re-entrancy** until the current invocation finishes. Typical cases: double click, button spam, repeated calls before the API responds.

A `@Blockable()` method should return a **`Promise`**, **`Observable`**, or **`Subscription`**, or a synchronous value. While the first operation is running, **subsequent calls return `undefined` immediately** (the original method body does not run). After success or error the flag resets and the next call proceeds.

| Return type | How the lock is released |
|-------------|---------------------------|
| `Promise` | `then` / `catch` of the first operation |
| `Subscription` | callback from `subscription.add(...)` when the subscription ends |
| `Observable` | see limitation below |
| otherwise (sync) | immediately after one pass |

**`Observable` limitation:** the decorator’s `pipe(tap(...))` is **never subscribed**, so it is not wired into the returned stream. For cold observables, releasing the flag may be unreliable. Prefer returning a **`Promise`** (`firstValueFrom(...)`) or a **`Subscription`** until the implementation is fixed.

#### Example: method on a **component** (common case)

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Blockable } from '@agilie/angular-helpies/decorators';

@Component({
  selector: 'app-checkout',
  template: `<button type="button" (click)="onPay()">Pay</button>`,
  standalone: true,
})
export class CheckoutComponent {
  constructor(private http: HttpClient) {}

  /** Repeated calls until the request completes return `undefined`. */
  @Blockable()
  private submitOrder(): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>('/api/orders', { items: [] }));
  }

  onPay(): void {
    const promise = this.submitOrder();
    if (promise === undefined) {
      return;
    }
    promise
      .then((order) => console.log('order', order.id))
      .catch((err) => console.error(err));
  }
}
```

For standalone apps, remember `provideHttpClient()` (or `HttpClientModule` in an `NgModule`).

#### Example: same pattern on a **service**

Useful when several places trigger the same action and you centralize logic in one service:

```typescript
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  constructor(private http: HttpClient) {}

  @Blockable()
  submitOrder(body: { items: string[] }): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>('/api/orders', body));
  }
}
```

Optionally add `loading` / `disabled` in the template for UX; `@Blockable()` still prevents repeated execution of the method **body**.

### `Unsubscribable(options?)` (class)

Parameter: `{ exclude: string[] }` (default `{ exclude: [] }`).

Wraps the class `ngOnDestroy`: walks **own** enumerable instance properties (`hasOwnProperty`); for each value with an `unsubscribe` function it calls `unsubscribe()`, except names listed in `exclude`. Then the original `ngOnDestroy` runs if it existed.

Limitations:

- Only **own** instance properties are considered (prototype / getters without an own property may be skipped).
- Use together with real `OnDestroy` code and subscriptions stored on fields.

### `Cacheable(options?)` (method)

Parameter: `Partial<{ lifetime: number }>`; `lifetime` appears in the type but **time-based expiry is not implemented** — after the first resolved value the method keeps returning the cached result (for observables, via `of(cachedValue)`).

Behaves like a **per-decorator-lifetime** cache (closure), with an `inProgress` state for the first call.

The method’s result kind is fixed on first success: `'observable' | 'promise' | 'value'`.

### `DecoratorsModule`

Empty `NgModule` with no declarations; exported for compatibility if you import a “package module” by convention. Decorators **do not require** this module — they apply at transpile time.

### More decorator examples

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { Unsubscribable } from '@agilie/angular-helpies/decorators';

@Component({
  selector: 'app-example',
  template: `...`,
  standalone: true,
})
@Unsubscribable({ exclude: ['keepAlive$'] })
export class ExampleComponent implements OnInit, OnDestroy {
  stream$!: Subscription;
  keepAlive$!: Subscription;

  ngOnInit(): void {
    this.stream$ = interval(1000).subscribe();
    this.keepAlive$ = interval(2000).subscribe();
  }

  ngOnDestroy(): void {
    // your logic; the decorator still chains to this hook
  }
}
```

```typescript
import { Cacheable } from '@agilie/angular-helpies/decorators';

class Api {
  @Cacheable()
  load(): Promise<Data> {
    return fetch('/api').then((r) => r.json());
  }
}
```

---

## Development (repo root)

```bash
npm install

# Build libraries into dist/
npx ng build interceptors
npx ng build decorators

# Demo app
npx ng serve demo

# Tests (specify project)
npx ng test interceptors --no-watch --browsers=ChromeHeadless
npx ng test decorators --no-watch --browsers=ChromeHeadless
npx ng test demo --no-watch --browsers=ChromeHeadless
```

Publishable artifacts live under `dist/interceptors` and `dist/decorators`. The generated `prepublishOnly` script may block publishing when Ivy **full** compilation was used — npm libraries usually need **partial** compilation via `ng-packagr` / `angularCompilerOptions`, which is outside this README.

---

## License

MIT (see `licence` / `license` in root and package `package.json` files).

---

## Possible improvements

- JSDoc / comments on the public API.
- Implement or remove `lifetime` in `Cacheable`.
- Fix the `Observable` branch in `Blockable` for predictable behavior.
- Align subpackage `peerDependencies` with supported Angular versions.
- Configure `compilationMode: partial` for publishable builds when needed.
