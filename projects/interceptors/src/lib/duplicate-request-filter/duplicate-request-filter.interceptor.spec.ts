import {async, getTestBed, TestBed} from '@angular/core/testing';

import {DuplicateRequestFilter} from './duplicate-request-filter.interceptor';
import {HTTP_INTERCEPTORS, HttpBackend, HttpClient} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

describe('DuplicateRequestFilter as a service', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule
    ],
    providers: [
      DuplicateRequestFilter,
    ]
  }));

  it('should be created', () => {
    const service: DuplicateRequestFilter = TestBed.get(DuplicateRequestFilter);
    expect(service).toBeTruthy();
  });

});

describe('DuplicateRequestFilter as an interceptor', () => {
  const apiUrl = '/test-path';
  let http: HttpClient;
  let mock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: HTTP_INTERCEPTORS, useClass: DuplicateRequestFilter, multi: true
      }]
    });
    http = TestBed.get(HttpClient);
    mock = TestBed.get(HttpTestingController);
  });

  it('should send only one request', async(() => {
    const fakeResponse = {};

    http.get(apiUrl).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });
    http.get(apiUrl).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });
    http.get(apiUrl).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });

    const request = mock.expectOne(apiUrl);
    request.flush(fakeResponse);
  }));

  it('should not duplicate requests for different urls', async(() => {
    const path1 = apiUrl + '/p1';
    const path2 = apiUrl + '/p2';
    const fakeResponse = {};

    http.get(path1).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });
    http.get(path2).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });

    const request1 = mock.expectOne(path1);
    const request2 = mock.expectOne(path2);

    request1.flush(fakeResponse);
    request2.flush(fakeResponse);
  }));

  it('should not duplicate requests of different method', async(() => {
    const fakeResponse = {};

    http.post(apiUrl, {}).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });
    http.put(apiUrl, {}).subscribe(res => {
      expect(res).toEqual(fakeResponse);
    });

    const getRequest = mock.expectOne({method: 'POST', url: apiUrl});
    const postRequest = mock.expectOne({method: 'PUT', url: apiUrl});

    getRequest.flush(fakeResponse);
    postRequest.flush(fakeResponse);
  }));

});
