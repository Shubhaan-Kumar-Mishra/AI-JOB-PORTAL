import mongoose, { Schema, Document } from 'mongoose';

export interface ParsedEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ParsedExperience {
  company: string | null;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ParsedProject {
  name: string | null;
  description: string | null;
  technologies: string[];
}

export interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
}

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: 'pdf' | 'docx';
  fileSize: number;
  rawText: string;
  parsedData: ParsedResumeData;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema: Schema<IResume> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1 active resume per user
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    parsedData: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      location: { type: String, default: null },
      summary: { type: String, default: null },
      skills: [{ type: String }],
      education: [
        {
          institution: { type: String, default: null },
          degree: { type: String, default: null },
          field: { type: String, default: null },
          startDate: { type: String, default: null },
          endDate: { type: String, default: null },
        },
      ],
      experience: [
        {
          company: { type: String, default: null },
          position: { type: String, default: null },
          startDate: { type: String, default: null },
          endDate: { type: String, default: null },
          description: { type: String, default: null },
        },
      ],
      projects: [
        {
          name: { type: String, default: null },
          description: { type: String, default: null },
          technologies: [{ type: String }],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
