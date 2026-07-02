import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: messageService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows a PrimeNG toast for API problem details', () => {
    http.get('/api/failing').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/api/failing');
    request.flush(
      { title: 'Validation failed', detail: 'The request contains invalid fields.', status: 400 },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Validation failed',
      detail: 'The request contains invalid fields.',
    });
  });

  it('does not show a toast for non-API requests', () => {
    http.get('/assets/config.json').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('/assets/config.json');
    request.flush({}, { status: 404, statusText: 'Not Found' });

    expect(messageService.add).not.toHaveBeenCalled();
  });
});
