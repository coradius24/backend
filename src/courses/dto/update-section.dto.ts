import { PartialType } from '@nestjs/swagger';
import { CourseSectionDto } from './create-section.dto';

class UpdateSectionDto extends PartialType(CourseSectionDto)  {}

export { UpdateSectionDto };
