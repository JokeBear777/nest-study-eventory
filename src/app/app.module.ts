import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configModule } from './modules/config.module';
import { LoggerMiddleware } from '../common/middlewares/logger.middleware';
import { RegionModule } from '../region/region.module';
import { CommonModule } from '../common/common.module';
import { ReviewModule } from '../review/review.module';
import { UserModule } from '../user/user.module';
import { CategoryModule } from 'src/category/category.module';
import { EventModule } from 'src/event/event.module';
import { AuthModule } from '../auth/auth.module';
import { clubModule } from 'src/club/club.module';

@Module({
  imports: [
    configModule,
    RegionModule,
    CommonModule,
    ReviewModule,
    UserModule,
    CategoryModule,
    EventModule,
    clubModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
