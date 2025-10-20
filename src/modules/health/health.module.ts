import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PrometheusService } from '../../shared/metrics/prometheus.service';

@Module({
  controllers: [HealthController, MetricsController],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class HealthModule {}

