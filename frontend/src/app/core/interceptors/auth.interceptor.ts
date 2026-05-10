import { Injectable, signal } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private totalRequests = 0;
  isLoading = signal(false);

  show() {
    this.totalRequests++;
    this.isLoading.set(true);
  }

  hide() {
    this.totalRequests--;
    if (this.totalRequests <= 0) {
      this.totalRequests = 0;
      this.isLoading.set(false);
    }
  }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private loader: LoaderService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Start loader
    this.loader.show();

    const token = localStorage.getItem('token');
    let authReq = req;
    
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      }),
      finalize(() => {
        // Stop loader only when request finishes
        this.loader.hide();
      })
    );
  }
}
