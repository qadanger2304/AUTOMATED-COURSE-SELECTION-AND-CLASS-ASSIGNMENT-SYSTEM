import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BuoiHocChiTiet extends Document {
  @Prop() ngay_hoc: Date;
  @Prop() tuan_thu: number;
  @Prop({ default: 'Bình thường' }) trang_thai: string;
}
export const BuoiHocChiTietSchema = SchemaFactory.createForClass(BuoiHocChiTiet);

@Schema({ collection: 'thoi_khoa_bieu', timestamps: true })
export class ThoiKhoaBieu extends Document {
  @Prop({ required: true, unique: true })
  ma_lop_hp: string;

  @Prop({ type: [String], default: [] })
  danh_sach_sv: string[];
  @Prop() ma_hoc_phan: string;
  @Prop() ten_hoc_phan: string;
  @Prop() ma_gv: string;
  @Prop() hoc_ky: number;
  
  @Prop() phong: string;
  @Prop() thu: string;
  @Prop() ca_dau: string;
  @Prop() ca_cuoi: string;
  @Prop() so_buoi_hoc: number;

  @Prop({ type: [BuoiHocChiTiet], default: [] })
  chi_tiet_buoi_hoc: BuoiHocChiTiet[];
}

export const ThoiKhoaBieuSchema = SchemaFactory.createForClass(ThoiKhoaBieu);