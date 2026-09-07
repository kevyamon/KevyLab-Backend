import { Schema, model, Document, Types } from 'mongoose';
import { SubmissionStatus, TechnicalProfileType } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : CANDIDATURE (Submission)
 * ============================================================================
 * Stocke l'intégralité du dossier de candidature : candidat/équipe, projet,
 * profil technique, statut du workflow, et évaluation confidentielle.
 * ============================================================================
 */

export interface ITeamMember {
  fullName: string;
  role?: string;
  email?: string;
}

export interface IInternalReview {
  scores: Record<string, number>;
  totalScore: number;
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface ILaureateProfile {
  photoUrl?: string;
  role?: string;
  bio?: string;
  distinction?: string;
  rank?: number;
}

export interface ISubmission extends Document {
  reference: string;
  eventId: Types.ObjectId | string;
  candidate: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city?: string;
    teamType: 'SOLO' | 'TEAM';
    teamName?: string;
    teamMembers: ITeamMember[];
  };
  project: {
    title: string;
    tagline?: string;
    problem: string;
    problemImportance?: string;
    solution: string;
    targetAudience: string;
    mvpFeatures: string[];
    prototypeExists: boolean;
    prototypeUrl?: string;
    githubUrl?: string;
  };
  technicalProfile: {
    level: TechnicalProfileType;
    experience?: string;
    technologies?: string[];
  };
  agreements: {
    accurateInformation: boolean;
    acceptedRules: boolean;
    consentContact: boolean;
  };
  status: SubmissionStatus;
  ranking?: string;
  publicWinner: boolean;
  laureateProfile?: ILaureateProfile;
  review?: IInternalReview;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'L’identifiant d’événement est obligatoire'],
      index: true
    },
    candidate: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      teamType: { type: String, enum: ['SOLO', 'TEAM'], default: 'SOLO', required: true },
      teamName: { type: String, trim: true },
      teamMembers: [
        {
          fullName: { type: String, required: true, trim: true },
          role: { type: String, trim: true },
          email: { type: String, trim: true, lowercase: true }
        }
      ]
    },
    project: {
      title: { type: String, required: true, trim: true, maxlength: 100 },
      tagline: { type: String, trim: true, maxlength: 160 },
      problem: { type: String, required: true, trim: true, maxlength: 2000 },
      problemImportance: { type: String, trim: true, maxlength: 2000 },
      solution: { type: String, required: true, trim: true, maxlength: 2000 },
      targetAudience: { type: String, required: true, trim: true, maxlength: 1000 },
      mvpFeatures: [{ type: String, trim: true, maxlength: 250 }],
      prototypeExists: { type: Boolean, default: false },
      prototypeUrl: { type: String, trim: true },
      githubUrl: { type: String, trim: true }
    },
    technicalProfile: {
      level: {
        type: String,
        enum: Object.values(TechnicalProfileType),
        default: TechnicalProfileType.BEGINNER,
        required: true
      },
      experience: { type: String, trim: true },
      technologies: [{ type: String, trim: true }]
    },
    agreements: {
      accurateInformation: { type: Boolean, required: true },
      acceptedRules: { type: Boolean, required: true },
      consentContact: { type: Boolean, required: true }
    },
    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.PENDING,
      required: true,
      index: true
    },
    ranking: { type: String, trim: true },
    publicWinner: { type: Boolean, default: false, index: true },
    laureateProfile: {
      photoUrl: { type: String, trim: true },
      role: { type: String, trim: true },
      bio: { type: String, trim: true },
      distinction: { type: String, trim: true },
      rank: { type: Number, min: 1 }
    },
    review: {
      scores: { type: Map, of: Number, default: {} },
      totalScore: { type: Number, default: 0, index: true },
      adminNotes: { type: String, trim: true, maxlength: 5000 },
      reviewedAt: { type: Date },
      reviewedBy: { type: String }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Index de déduplication composé pour prévenir les soumissions accidentelles identiques
submissionSchema.index(
  { eventId: 1, 'candidate.email': 1, 'project.title': 1 },
  { unique: true }
);

// Index textuel pour les recherches rapides du Dashboard administrateur
submissionSchema.index({
  reference: 'text',
  'candidate.fullName': 'text',
  'candidate.email': 'text',
  'project.title': 'text',
  'candidate.country': 'text'
});

export const SubmissionModel = model<ISubmission>('Submission', submissionSchema);
