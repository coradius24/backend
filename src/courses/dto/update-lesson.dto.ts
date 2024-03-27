import { PartialType } from '@nestjs/swagger';
import { CreateLessonDto } from './create-lesson.dto';

class UpdateLessonDto extends PartialType(CreateLessonDto)  {}

export { UpdateLessonDto };
