import { FaqItemModel, IFaqItem } from '../models/FaqItem';

/**
 * ============================================================================
 * KEVYLAB — DÉPÔT D'ACCÈS AUX DONNÉES : FAQ (faqRepository)
 * ============================================================================
 * Centralise l'accès aux questions/réponses générales de la plateforme et
 * aux FAQs spécifiques associées aux éditions du concours (Appathon).
 * ============================================================================
 */

export class FaqRepository {
  /**
   * Récupère la FAQ générale du laboratoire publiée et ordonnée
   */
  async findGlobal(): Promise<IFaqItem[]> {
    return FaqItemModel.find({ scope: 'GLOBAL', published: true })
      .sort({ order: 1, createdAt: 1 })
      .lean() as unknown as IFaqItem[];
  }

  /**
   * Récupère la FAQ dédiée à un événement publié et ordonné
   */
  async findByEvent(eventId: string): Promise<IFaqItem[]> {
    return FaqItemModel.find({
      $or: [
        { scope: 'EVENT', eventId, published: true },
        { scope: 'GLOBAL', published: true }
      ]
    })
      .sort({ order: 1, createdAt: 1 })
      .lean() as unknown as IFaqItem[];
  }

  /**
   * Récupère l'ensemble des FAQs pour l'administration (publiées et brouillons)
   */
  async findAllAdmin(): Promise<IFaqItem[]> {
    return FaqItemModel.find()
      .sort({ scope: 1, order: 1, createdAt: -1 })
      .lean() as unknown as IFaqItem[];
  }

  /**
   * Recherche un élément de FAQ par son identifiant
   */
  async findById(id: string): Promise<IFaqItem | null> {
    return FaqItemModel.findById(id);
  }

  /**
   * Crée un nouvel élément de FAQ
   */
  async create(data: Partial<IFaqItem>): Promise<IFaqItem> {
    return FaqItemModel.create(data);
  }

  /**
   * Met à jour un élément de FAQ existant
   */
  async update(id: string, data: Partial<IFaqItem>): Promise<IFaqItem | null> {
    return FaqItemModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * Supprime définitivement un élément de FAQ
   */
  async delete(id: string): Promise<boolean> {
    const result = await FaqItemModel.findByIdAndDelete(id);
    return Boolean(result);
  }
}

export const faqRepository = new FaqRepository();
