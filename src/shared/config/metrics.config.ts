import { register } from 'prom-client';

// Configuração global do Prometheus
export const metricsConfig = {
 
  collectDefaultMetrics: {
    register,
    prefix: 'oet_',
    timeout: 5000,
  },
  
 
  defaultLabels: {
    app: 'api-oet',
    version: process.env['npm_package_version'] || '1.0.0',
  },
};