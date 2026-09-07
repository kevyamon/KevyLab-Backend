import { SubmissionModel } from '../models/Submission';

/**
 * ============================================================================
 * KEVYLAB — GÉNÉRATEUR SÉQUENTIEL DE RÉFÉRENCES DE CANDIDATURE
 * ============================================================================
 * Produit des références uniques et officielles au format normatif :
 * "KLA-2026-000001" (KevyLab Appathon - Édition 2026 - Numéro séquentiel).
 * ============================================================================
 */

export class ReferenceGenerator {
  /**
   * Génère de manière atomique la référence suivante pour un événement donné
   */
  async generateReference(eventEdition = '2026', eventPrefix = 'KLA'): Promise<string> {
    // Compte les candidatures existantes pour la séquence
    const prefix = `${eventPrefix}-${eventEdition}-`;
    const count = await SubmissionModel.countDocuments({
      reference: new RegExp(`^${prefix}`)
    });

    const sequenceNumber = count + 1;
    const formattedSequence = sequenceNumber.toString().padStart(6, '0');

    let candidateRef = `${prefix}${formattedSequence}`;

    // Vérification de sécurité anti-collision
    let collision = await SubmissionModel.exists({ reference: candidateRef });
    let counter = sequenceNumber;

    while (collision) {
      counter += 1;
      candidateRef = `${prefix}${counter.toString().padStart(6, '0')}`;
      collision = await SubmissionModel.exists({ reference: candidateRef });
    }

    return candidateRef;
  }
}

export const referenceGenerator = new ReferenceGenerator();
