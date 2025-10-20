import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '../../controllers/metrics.controller';
import { PrometheusService } from '../../../../shared/metrics/prometheus.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let prometheusService: PrometheusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: PrometheusService,
          useValue: {
            getMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    prometheusService = module.get<PrometheusService>(PrometheusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics string', async () => {
      // Arrange
      const mockMetrics = 'oet_http_requests_total 10';
      jest.spyOn(prometheusService, 'getMetrics').mockResolvedValue(mockMetrics);

      // Act
      const result = await controller.getMetrics();

      // Assert
      expect(result).toBe(mockMetrics);
      expect(prometheusService.getMetrics).toHaveBeenCalled();
    });
  });
});