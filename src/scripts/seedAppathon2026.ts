import { connectDatabase, disconnectDatabase } from '../config/database';
import { EventModel } from '../models/Event';
import { EvaluationCriterionModel } from '../models/EvaluationCriterion';
import { LabProjectModel } from '../models/LabProject';
import { EventStatus, EventType, ProjectCategory, ProjectStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — SCRIPT D'INITIALISATION INITIALE (Seed Appathon 2026 & Projets)
 * ============================================================================
 * Injecte l'événement fondateur EVENT #001 (KevyLab Appathon 2026) avec
 * sa grille officielle sur 100 points et les réalisations initiales du Lab.
 * ============================================================================
 */

const seed = async () => {
  try {
    console.log('🌱 Amorçage de la base de données KevyLab...');
    await connectDatabase();

    // 1. Initialisation de l'événement Appathon 2026
    let appathon = await EventModel.findOne({ slug: 'kevy-lab-appathon-2026' });
    if (!appathon) {
      appathon = await EventModel.create({
        name: 'KevyLab Appathon 2026',
        slug: 'kevy-lab-appathon-2026',
        type: EventType.APPATHON,
        edition: '2026',
        tagline: 'Le premier concours d’innovation logicielle du laboratoire KevyLab.',
        description:
          'Concours officiel visant à identifier, primer et accompagner les concepts d’applications les plus prometteurs et utiles.',
        status: EventStatus.APPLICATIONS_OPEN,
        isFeatured: true,
        resultsPublished: false,
        applicationOpenAt: new Date(),
        applicationCloseAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      });
      console.log('✅ Événement fondateur Appathon 2026 créé.');
    }

    // 2. Grille de notation sur 100 points
    const existingCriteria = await EvaluationCriterionModel.countDocuments({ eventId: appathon.id });
    if (existingCriteria === 0) {
      await EvaluationCriterionModel.insertMany([
        {
          eventId: appathon.id,
          key: 'utility',
          label: 'Utilité concrète & Résolution du problème',
          maxScore: 30,
          order: 1,
          active: true
        },
        {
          eventId: appathon.id,
          key: 'feasibility',
          label: 'Faisabilité technique & Clarté architecturale',
          maxScore: 25,
          order: 2,
          active: true
        },
        {
          eventId: appathon.id,
          key: 'clarity_mvp',
          label: 'Clarté des fonctionnalités MVP',
          maxScore: 20,
          order: 3,
          active: true
        },
        {
          eventId: appathon.id,
          key: 'growth',
          label: 'Potentiel de croissance & Viabilité',
          maxScore: 15,
          order: 4,
          active: true
        },
        {
          eventId: appathon.id,
          key: 'originality',
          label: 'Originalité & Caractère novateur',
          maxScore: 10,
          order: 5,
          active: true
        }
      ]);
      console.log('✅ Grille de 5 critères sur 100 points initialisée.');
    }

    // 3. Projets authentiques du laboratoire
    const projectCount = await LabProjectModel.countDocuments();
    if (projectCount === 0) {
      await LabProjectModel.insertMany([
        {
          name: 'KevyLab Analytics Core',
          slug: 'kevylab-analytics-core',
          tagline: 'Moteur de télémétrie et de suivi d’indicateurs respectueux de la vie privée.',
          description:
            'Système modulaire d’analyse de trafic et de suivi d’événements en temps réel sans collecte invasive de données personnelles.',
          problem: 'Les outils analytiques traditionnels sont lourds, invasifs et compromettent la confidentialité.',
          solution: 'Un moteur léger, agrégé, auto-hébergeable et strictement conforme au RGPD.',
          category: ProjectCategory.WEB,
          status: ProjectStatus.IN_DEVELOPMENT,
          platforms: ['Web', 'Docker'],
          technologies: ['TypeScript', 'Node.js', 'MongoDB'],
          featured: true
        },
        {
          name: 'Pulse AI Assistant',
          slug: 'pulse-ai-assistant',
          tagline: 'Agent d’orchestration pour l’ingénierie et l’automatisation de code.',
          description:
            'Expérimentation autour de flux d’agents collaboratifs pour l’audit de code et l’assistance au développement.',
          problem: 'La revue manuelle exhaustive de grands dépôts ralentit le rythme de livraison logicielle.',
          solution: 'Un modèle de contrôle continu de cohérence et de détection précoce d’anomalies.',
          category: ProjectCategory.IA,
          status: ProjectStatus.PROTOTYPE,
          platforms: ['CLI', 'API'],
          technologies: ['Python', 'FastAPI', 'LLM Agents'],
          featured: true
        }
      ]);
      console.log('✅ Projets initiaux du Lab enregistrés.');
    }

    console.log('🎉 Amorçage terminé avec succès.');
  } catch (error) {
    console.error('❌ Échec lors de l’amorçage :', error);
  } finally {
    await disconnectDatabase();
  }
};

seed();
