import { Schema, model, Document } from 'mongoose';
import { EventStatus, EventType } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : ÉVÉNEMENT (Event)
 * ============================================================================
 * Entité générique supportant les multiples événements et éditions (Appathons,
 * Hackathons, Challenges). Ne code jamais l'Appathon en dur.
 * ============================================================================
 */

export interface IEvent extends Document {
  name: string;
  slug: string;
  type: EventType;
  edition?: string;
  tagline?: string;
  description: string;
  status: EventStatus;
  applicationOpenAt?: Date;
  applicationCloseAt?: Date;
  reviewStartAt?: Date;
  resultAt?: Date;
  coverImageUrl?: string;
  rulesDocumentUrl?: string;
  isFeatured: boolean;
  resultsPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de l’événement est obligatoire'],
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
    type: {
      type: String,
      enum: Object.values(EventType),
      default: EventType.APPATHON,
      required: true
    },
    edition: {
      type: String,
      trim: true
    },
    tagline: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La description de l’événement est obligatoire']
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT,
      required: true,
      index: true
    },
    applicationOpenAt: {
      type: Date
    },
    applicationCloseAt: {
      type: Date
    },
    reviewStartAt: {
      type: Date
    },
    resultAt: {
      type: Date
    },
    coverImageUrl: {
      type: String,
      trim: true
    },
    rulesDocumentUrl: {
      type: String,
      trim: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    resultsPublished: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const EventModel = model<IEvent>('Event', eventSchema);
