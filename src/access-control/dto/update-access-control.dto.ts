import { PartialType } from '@nestjs/swagger';
import { AddFeatureDto } from './add-feature.dto';

export class UpdateFeatureDto extends PartialType(AddFeatureDto) {}
