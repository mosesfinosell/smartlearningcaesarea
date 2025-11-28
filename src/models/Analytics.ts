import mongoose, { Document, Schema } from 'mongoose';

export interface IPageView extends Document {
  path: string;
  count: number;
  lastVisited: Date;
}

const pageViewSchema = new Schema<IPageView>(
  {
    path: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    lastVisited: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PageView = mongoose.model<IPageView>('PageView', pageViewSchema);
