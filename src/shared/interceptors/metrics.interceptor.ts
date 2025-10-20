import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap, finalize } from 'rxjs/operators';
  import { Request, Response } from 'express';
  import { PrometheusService } from '../../shared/metrics/prometheus.service';
  
  @Injectable()
  export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly prometheusService: PrometheusService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest<Request>();
      const response = httpContext.getResponse<Response>();
  
      const startTime = Date.now();
      const route = request.route?.path || request.url;
      const method = request.method;
  
      // Incrementar requests ativos
      this.prometheusService.activeRequests.inc();
  
      return next.handle().pipe(
        tap({
          next: () => {
            this.recordMetrics(request, response, startTime, route, method, 'success');
          },
          error: (_error) => {
            this.recordMetrics(request, response, startTime, route, method, 'error');
          },
        }),
        finalize(() => {
          // Decrementar requests ativos
          this.prometheusService.activeRequests.dec();
        }),
      );
    }
  
    private recordMetrics(
      _request: Request,
      response: Response,
      startTime: number,
      route: string,
      method: string,
      _status: string,
    ): void {
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = response.statusCode;
  
      // Métricas HTTP gerais
      this.prometheusService.httpRequestsTotal
        .labels(method, route, statusCode.toString())
        .inc();
  
      this.prometheusService.httpRequestDuration
        .labels(method, route, statusCode.toString())
        .observe(duration);
  
      // Métricas específicas do OET
      if (route.includes('/oet/incidents')) {
        this.prometheusService.incidentsCreatedTotal
          .labels(statusCode >= 200 && statusCode < 300 ? 'success' : 'error')
          .inc();
  
        this.prometheusService.incidentDuration
          .labels(statusCode >= 200 && statusCode < 300 ? 'success' : 'error')
          .observe(duration);
      }
    }
  }