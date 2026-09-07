import { Schema, model, Document, Types } from 'mongoose';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : CRITÈRE D'ÉVALUATION (EvaluationCriterion)
 * ============================================================================
 * Permet la configuration dynamique des critères de notation par événement.
 * La somme des scores maximaux doit totaliser 100 pour l'Appathon.
 * ============================================================================
 */

export interface IEvaluationCriterion extends Document {
  eventId: Types.ObjectId | string;
  key: string;
  label: string;
  description?: string;
  maxScore: number;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationCriterionSchema = new Schema<IEvaluationCriterion>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'L’identifiant de l’événement associé est obligatoire'],
      index: true
    },
    key: {
      type: String,
      required: [true, 'La clé unique du critère est obligatoire'],
      trim: true,
      lowercase: true
    },
    label: {
      type: String,
      required: [true, 'Le libellé du critère est obligatoire'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    maxScore: {
      type: Number,
      required: [true, 'Le score maximal est obligatoire'],
      min: [1, 'Le score maximal doit être d’au moins 1 point']
    },
    order: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Unicité de la clé du critère au sein d'un même événement
evaluationCriterionSchema.index({ eventId: 1, key: 1 }, { unique: true });

export const EvaluationCriterionModel = model<IEvaluationCriterion>(
  'EvaluationCriterion',
  evaluationCriterionSchema
);
