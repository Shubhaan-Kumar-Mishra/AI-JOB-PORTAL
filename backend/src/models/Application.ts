import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationStatus = 'applied' | 'under_review' | 'interview' | 'offer' | 'rejected';

export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobUrl: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema: Schema<IApplication> = new Schema(
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
    jobTitle: {
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
    status: {
      type: String,
      enum: ['applied', 'under_review', 'interview', 'offer', 'rejected'],
      default: 'applied',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      maxLength: 2000,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one user cannot apply/track duplicate application per job ID
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
