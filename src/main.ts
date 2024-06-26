import { AccessControlModule } from './access-control/access-control.module';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {  
  cors: {
    origin: ['http://dev.upspotlimited.com:3000', 'http://upspotlimited.com:3000', 'http://localhost:3000', 'http://upspotlimited.com',  'https://upspotlimited.com', 'https://upspot-academy-client.vercel.app',
    'https://www.upspotlimited.com', 'http://www.upspotlimited.com',  'https://new.upspotacademy.com', 'http://new.upspotacademy.com', 'http://www.new.upspotacademy.com', 'https://www.new.upspotacademy.com', 'upspotacademy.com', 'https://upspotacademy.com', 'https://www.upspotacademy.com', 'https://uply.pro', 'https://getyourtools.app'],
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: ['customFileName']
  },
 });
  const config = new DocumentBuilder()
    .setTitle('Upspot Academy')
    .setDescription('APIs for upspot academy')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());


  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      // Specify the supported content types in the Swagger UI configuration.
      supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'],
      consumes: ['application/json', 'multipart/form-data'],
    },
  
  });

  await app.listen(process.env.PORT || 8000);
}
bootstrap();
