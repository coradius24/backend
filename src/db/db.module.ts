// src/db/db.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './data-source';

@Module({
  imports: [TypeOrmModule.forRootAsync({
    useClass: DatabaseConfig,
  })],
})
export class DbModule {}
