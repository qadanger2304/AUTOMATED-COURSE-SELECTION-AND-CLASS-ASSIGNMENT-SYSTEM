import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'hoc_ky' })
export class HocKy extends Document {
  @Prop() declare _id: string;
  @Prop() ma_hoc_ky: number;
  @Prop() ten: string;
  @Prop() nam_hoc: string;
  @Prop() trang_thai: string;
}

export const HocKySchema = SchemaFactory.createForClass(HocKy);
