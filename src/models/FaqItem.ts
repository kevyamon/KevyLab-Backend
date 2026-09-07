import { Schema, model, Document, Types } from 'mongoose';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : ÉLÉMENT DE FAQ (FaqItem)
 * ============================================================================
 * Supporte les questions/réponses générales de la plateforme KevyLab
 * ainsi que les FAQs spécifiques à un événement donné.
 * ============================================================================
 */

export interface IFaqItem extends Document {
  scope: 'GLOBAL' | 'EVENT';
  eventId?: Types.ObjectId | string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqItemSchema = new Schema<IFaqItem>(
  {
    scope: {
      type: String,
      enum: ['GLOBAL', 'EVENT'],
      default: 'GLOBAL',
      required: true,
      index: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      index: true
    },
    question: {
      type: String,
      required: [true, 'La question est obligatoire'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'La réponse est obligatoire'],
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    published: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

faqItemSchema.index({ scope: 1, eventId: 1, order: 1 });

export const FaqItemModel = model<IFaqItem>('FaqItem', faqItemSchema);
