import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AssignmentsAdminController } from './assignments.admin.controller';
import { Assignment } from './entities/assignment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, AssignmentSubmission])],
  controllers: [AssignmentsController, AssignmentsAdminController],
  providers: [AssignmentsService],
  exports: [TypeOrmModule.forFeature([Assignment, AssignmentSubmission]), AssignmentsService]
})
export class AssignmentsModule {}
