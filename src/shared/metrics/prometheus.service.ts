import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class PrometheusService {
  // Contadores
  public readonly httpRequestsTotal = new Counter({
    name: 'oet_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  public readonly incidentsCreatedTotal = new Counter({
    name: 'oet_incidents_created_total',
    help: 'Total number of incidents created',
    labelNames: ['status'],
  });

  public readonly filesProcessedTotal = new Counter({
    name: 'oet_files_processed_total',
    help: 'Total number of files processed',
    labelNames: ['status'],
  });

  // Histogramas (para latência)
  public readonly httpRequestDuration = new Histogram({
    name: 'oet_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  public readonly incidentDuration = new Histogram({
    name: 'oet_incident_duration_seconds',
    help: 'Duration of incident creation in seconds',
    labelNames: ['status'],
    buckets: [0.5, 1, 2, 5, 10, 15, 30],
  });

  // Gauges (valores atuais)
  public readonly activeRequests = new Gauge({
    name: 'oet_active_requests',
    help: 'Number of active requests',
  });

  // Método para obter métricas
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}