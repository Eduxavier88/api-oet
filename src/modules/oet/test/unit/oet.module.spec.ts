import { Test } from '@nestjs/testing';
import { OetModule } from '../../oet.module';
import { INestApplication } from '@nestjs/common';

describe('OetModule - Smoke Test', () => {
  let app: INestApplication;

  it('should compile module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [OetModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    expect(app).toBeDefined();

    await app.close();
  });
});


