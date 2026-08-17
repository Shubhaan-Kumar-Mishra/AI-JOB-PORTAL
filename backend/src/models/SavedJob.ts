import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedJob extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  jobUrl: string;
  salary?: {
    min?: number | null;
    max?: number | null;
    isPredicted?: boolean;
  };
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedJobSchema: Schema<ISavedJob> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    jobUrl: {
      type: String,
      required: true,
    },
    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      isPredicted: { type: Boolean, default: false },
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one candidate cannot save the exact same job twice
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJob = mongoose.model<ISavedJob>('SavedJob', savedJobSchema);
