import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OetModule } from './modules/oet/oet.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    HttpModule.register({
      timeout: Number.parseInt(process.env['HTTP_TIMEOUT'] || '15000', 10),
      maxRedirects: 2,
    }),
    OetModule,
    HealthModule,
  ],
 
})
export class AppModule {}
