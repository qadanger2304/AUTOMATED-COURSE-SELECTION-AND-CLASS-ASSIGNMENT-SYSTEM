import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LopHocPhanConfig extends Document {
  @Prop({ required: true, index: true })
  ma_hoc_phan: string;
  @Prop({ required: true, index: true })
  hoc_ky: number;
  @Prop({ required: true })
  si_so_toi_da: number;
  @Prop({ required: true })
  si_so_toi_thieu: number;
  @Prop()
  updated_by_admin_id?: string;
}
export const LopHocPhanConfigSchema = SchemaFactory.createForClass(LopHocPhanConfig);
LopHocPhanConfigSchema.index({ ma_hoc_phan: 1, hoc_ky: 1 }, { unique: true });