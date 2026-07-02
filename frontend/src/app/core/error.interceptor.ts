import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
};

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const messageService = inject(MessageService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && request.url.startsWith('/api')) {
        messageService.add({
          severity: 'error',
          summary: resolveSummary(error),
          detail: resolveDetail(error),
        });
      }

      return throwError(() => error);
    }),
  );
};

function resolveSummary(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Anmeldung erforderlich';
  }

  if (error.status === 403) {
    return 'Keine Berechtigung';
  }

  const body = error.error as ProblemDetails | null;
  return body?.title ?? 'Fehler beim Laden';
}

function resolveDetail(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Bitte melde dich erneut an.';
  }

  if (error.status === 403) {
    return 'Du hast für diese Aktion keine Berechtigung.';
  }

  const body = error.error as ProblemDetails | null;
  return body?.detail ?? 'Die Anfrage konnte nicht verarbeitet werden.';
}
