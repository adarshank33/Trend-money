import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Trend Money API')
    .setDescription('API Gateway for the investment platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const authRoutes = ['/auth'];
  const productRoutes = ['/products'];
  const orderRoutes = ['/orders'];
  const portfolioRoutes = ['/portfolio'];

  for (const path of Object.keys(document.paths)) {
    const pathItem = document.paths[path];
    const methods = ['get', 'post', 'patch', 'delete'] as const;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      if (authRoutes.some(r => path.startsWith(r))) {
        op.tags = ['Auth Service'];
      } else if (productRoutes.some(r => path.startsWith(r))) {
        op.tags = ['Product Service'];
      } else if (orderRoutes.some(r => path.startsWith(r))) {
        op.tags = ['Order Service'];
      } else if (portfolioRoutes.some(r => path.startsWith(r))) {
        op.tags = ['Portfolio Service'];
      }
    }
  }

  SwaggerModule.setup('docs', app, document);
  await app.listen(Number(process.env.PORT));
}
bootstrap();
