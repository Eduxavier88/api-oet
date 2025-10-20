import { Controller, Get } from '@nestjs/common';
import { PrometheusService } from '../../../shared/metrics/prometheus.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}