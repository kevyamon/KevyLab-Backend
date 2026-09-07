/**
 * ============================================================================
 * KEVYLAB — ÉNUMÉRATIONS DU DOMAINE MÉTIER
 * ============================================================================
 * Définit les énumérations normatives du projet conformément au Cahier des Charges.
 * ============================================================================
 */

/**
 * Types d'événements supportés par la plateforme
 */
export enum EventType {
  APPATHON = 'APPATHON',
  HACKATHON = 'HACKATHON',
  CHALLENGE = 'CHALLENGE',
  CALL_FOR_PROJECTS = 'CALL_FOR_PROJECTS'
}

/**
 * Cycle de vie et statut d'un événement
 */
export enum EventStatus {
  DRAFT = 'DRAFT',
  ANNOUNCED = 'ANNOUNCED',
  APPLICATIONS_OPEN = 'APPLICATIONS_OPEN',
  APPLICATIONS_CLOSED = 'APPLICATIONS_CLOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Machine à états d'une candidature
 */
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  NEEDS_INFORMATION = 'NEEDS_INFORMATION',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WINNER = 'WINNER',
  WITHDRAWN = 'WITHDRAWN',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Type de profil technique du candidat ou de l'équipe
 */
export enum TechnicalProfileType {
  NON_TECHNICAL = 'NON_TECHNICAL',
  BEGINNER = 'BEGINNER',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  MIXED_TEAM = 'MIXED_TEAM',
  OTHER = 'OTHER'
}

/**
 * Catégories des projets du laboratoire KevyLab
 */
export enum ProjectCategory {
  APPLICATION_MOBILE = 'APPLICATION_MOBILE',
  WEB = 'WEB',
  IA = 'IA',
  RD = 'R&D',
  EXPERIMENTAL = 'EXPERIMENTAL'
}

/**
 * Statut d'avancement d'un projet du laboratoire
 */
export enum ProjectStatus {
  RESEARCH = 'RESEARCH',
  PROTOTYPE = 'PROTOTYPE',
  IN_DEVELOPMENT = 'IN_DEVELOPMENT',
  BETA = 'BETA',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Rôles administratifs avec privilèges hiérarchiques
 */
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  REVIEWER = 'REVIEWER'
}

/**
 * Type de message reçu via le formulaire de contact
 */
export enum ContactType {
  PARTNERSHIP = 'PARTNERSHIP',
  PROJECT = 'PROJECT',
  MEDIA = 'MEDIA',
  EVENT = 'EVENT',
  GENERAL = 'GENERAL',
  OTHER = 'OTHER'
}

/**
 * Statut de traitement d'un message de contact
 */
export enum ContactStatus {
  NEW = 'NEW',
  READ = 'READ',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Clés des modèles de courriels transactionnels Brevo
 */
export enum EmailTemplateKey {
  SUBMISSION_CREATED = 'SUBMISSION_CREATED',
  SUBMISSION_SHORTLISTED = 'SUBMISSION_SHORTLISTED',
  SUBMISSION_ACCEPTED = 'SUBMISSION_ACCEPTED',
  SUBMISSION_REJECTED = 'SUBMISSION_REJECTED',
  SUBMISSION_MORE_INFO_REQUESTED = 'SUBMISSION_MORE_INFO_REQUESTED',
  SUBMISSION_WINNER = 'SUBMISSION_WINNER',
  ADMIN_MANUAL_EMAIL = 'ADMIN_MANUAL_EMAIL'
}

/**
 * Statut d'envoi d'un courriel transactionnel
 */
export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

/**
 * Actions tracées dans le journal d'audit de sécurité
 */
export enum AuditAction {
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_CREATED = 'ADMIN_CREATED',
  SUBMISSION_REVIEWED = 'SUBMISSION_REVIEWED',
  SUBMISSION_STATUS_CHANGED = 'SUBMISSION_STATUS_CHANGED',
  WINNER_SELECTED = 'WINNER_SELECTED',
  EMAIL_SENT = 'EMAIL_SENT',
  EVENT_UPDATED = 'EVENT_UPDATED',
  PROJECT_PUBLISHED = 'PROJECT_PUBLISHED'
}
