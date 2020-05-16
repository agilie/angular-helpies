import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {share, tap} from 'rxjs/operators';

@Injectable()
export class DuplicateRequestFilter implements HttpInterceptor {

  private requestStorage = new Map();

  constructor() {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const reqId = this.requestId(req);
    const storedRequest = this.requestStorage.get(reqId);
    if (storedRequest) {
      return storedRequest;
    }
    const clone = next.handle(req)
      .pipe(
        share(),
        tap(
          success => {
            if (success instanceof HttpResponse) {
              this.requestStorage.delete(reqId);
            }
          },
          err => {
            if (err instanceof HttpErrorResponse) {
              this.requestStorage.delete(reqId);
            }
          }
        )
      );
    this.requestStorage.set(reqId, clone);
    return clone;
  }

  private requestId(req: HttpRequest<any>): string {
    return req.method + req.urlWithParams + req.serializeBody();
  }

}
