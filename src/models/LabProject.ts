import { Schema, model, Document } from 'mongoose';
import { ProjectCategory, ProjectStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : PROJET DU LABORATOIRE (LabProject)
 * ============================================================================
 * Présente les réalisations officielles, prototypes et travaux de R&D du Lab,
 * distinctement des événements et concours.
 * ============================================================================
 */

export interface ILabProject extends Document {
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  problem?: string;
  solution?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  logoUrl?: string;
  coverImageUrl?: string;
  gallery: string[];
  platforms: string[];
  technologies: string[];
  playStoreUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  featured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const labProjectSchema = new Schema<ILabProject>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du projet est obligatoire'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Le slug unique est obligatoire'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    tagline: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La description du projet est obligatoire']
    },
    problem: {
      type: String,
      trim: true
    },
    solution: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: Object.values(ProjectCategory),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.IN_DEVELOPMENT,
      required: true,
      index: true
    },
    logoUrl: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    gallery: [{ type: String, trim: true }],
    platforms: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }],
    playStoreUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const LabProjectModel = model<ILabProject>('LabProject', labProjectSchema);
