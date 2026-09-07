import { EmailTemplateKey } from '../../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLES DE COURRIELS TRANSACTIONNELS (Templates)
 * ============================================================================
 * Définit les modèles HTML soignés et accessibles pour chaque événement métier
 * conformément aux exigences normatives du Cahier des Charges.
 * ============================================================================
 */

export interface EmailRendered {
  subject: string;
  html: string;
}

const baseLayout = (title: string, bodyContent: string): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 32px 16px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; padding: 32px; }
    .header { border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #6366f1; }
    .content { font-size: 15px; line-height: 1.6; color: #d1d5db; }
    .highlight-box { background-color: #1f2937; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; margin: 20px 0; font-family: monospace; font-size: 16px; color: #ffffff; }
    .footer { border-top: 1px solid #1f2937; margin-top: 32px; padding-top: 20px; font-size: 13px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Kevy<span>Lab</span></div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>Laboratoire d’innovation logicielle & d’ingénierie numérique.</p>
      <p>Ce message automatique vous a été adressé par la plateforme officielle KevyLab.</p>
    </div>
  </div>
</body>
</html>
`;

export const renderEmailTemplate = (
  templateKey: EmailTemplateKey | string,
  variables: Record<string, string>
): EmailRendered => {
  switch (templateKey) {
    case EmailTemplateKey.SUBMISSION_CREATED:
      return {
        subject: `[KevyLab] Confirmation de votre candidature — ${variables.reference || ''}`,
        html: baseLayout(
          'Candidature reçue',
          `<h2>Bonjour ${variables.candidateName || ''},</h2>
          <p>Nous vous confirmons la bonne réception de votre candidature pour le projet <strong>« ${variables.projectTitle || ''} »</strong> au concours officiel.</p>
          <p>Votre dossier est identifié sous la référence unique suivante :</p>
          <div class="highlight-box">${variables.reference || ''}</div>
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Vérification de la conformité administrative par l’équipe de présélection ;</li>
            <li>Évaluation technique et notation selon les 5 critères officiels sur 100 points ;</li>
            <li>Notification individuelle des délibérations par courriel.</li>
          </ul>
          <p>Merci pour votre créativité et votre engagement dans l’écosystème KevyLab.</p>`
        )
      };

    case EmailTemplateKey.SUBMISSION_SHORTLISTED:
      return {
        subject: `[KevyLab] Félicitations ! Votre projet est présélectionné — ${variables.reference || ''}`,
        html: baseLayout(
          'Projet Présélectionné',
          `<h2>Félicitations ${variables.candidateName || ''} !</h2>
          <p>Le comité d’évaluation a examiné avec grand intérêt votre projet <strong>« ${variables.projectTitle || ''} »</strong> et a le plaisir de vous annoncer sa <strong>présélection officielle</strong>.</p>
          <div class="highlight-box">Référence : ${variables.reference || ''}</div>
          <p>Votre dossier avance vers la phase d'évaluation finale et d'examen approfondi.</p>`
        )
      };

    case EmailTemplateKey.SUBMISSION_ACCEPTED:
      return {
        subject: `[KevyLab] Excellente nouvelle : Votre candidature est acceptée — ${variables.reference || ''}`,
        html: baseLayout(
          'Candidature Acceptée',
          `<h2>Félicitations chaleureuses ${variables.candidateName || ''} !</h2>
          <p>Nous avons l'honneur de vous informer que votre projet <strong>« ${variables.projectTitle || ''} »</strong> a été officiellement <strong>accepté</strong> parmi les projets retenus pour cette édition.</p>
          <p>Vous recevrez sous peu les instructions détaillées et les accès pour la suite du programme.</p>`
        )
      };

    case EmailTemplateKey.SUBMISSION_REJECTED:
      return {
        subject: `[KevyLab] Suivi de votre candidature — ${variables.reference || ''}`,
        html: baseLayout(
          'Suivi de candidature',
          `<h2>Bonjour ${variables.candidateName || ''},</h2>
          <p>Nous vous remercions chaleureusement pour votre participation et pour l'intérêt que vous avez manifesté en présentant <strong>« ${variables.projectTitle || ''} »</strong>.</p>
          <p>Après une étude minutieuse et compte tenu du nombre limité de places, nous avons le regret de vous informer que votre dossier n’a pas été retenu pour l’étape suivante.</p>
          <p>Cette décision n'enlève rien à la qualité de votre démarche. Nous vous encourageons vivement à continuer de développer votre idée et espérons vous revoir lors d’une prochaine initiative du laboratoire.</p>`
        )
      };

    case EmailTemplateKey.SUBMISSION_MORE_INFO_REQUESTED:
      return {
        subject: `[KevyLab] Demande de précisions sur votre projet — ${variables.reference || ''}`,
        html: baseLayout(
          'Précisions requises',
          `<h2>Bonjour ${variables.candidateName || ''},</h2>
          <p>L’équipe d’évaluation a examiné votre projet <strong>« ${variables.projectTitle || ''} »</strong> et souhaiterait obtenir quelques précisions complémentaires afin de finaliser votre revue :</p>
          <div class="highlight-box" style="font-family: inherit; font-size: 15px; white-space: pre-wrap;">${variables.message || ''}</div>
          <p>Vous pouvez répondre directement à ce courriel en précisant votre référence : <strong>${variables.reference || ''}</strong>.</p>`
        )
      };

    case EmailTemplateKey.SUBMISSION_WINNER:
      return {
        subject: `[KevyLab] Félicitations officielles : Vous êtes Lauréat de l’Appathon ! — ${variables.reference || ''}`,
        html: baseLayout(
          'Félicitations au Lauréat',
          `<h2>Félicitations exceptionnelles ${variables.candidateName || ''} !</h2>
          <p>Le comité d’ingénierie et le jury officiel du <strong>KevyLab Appathon</strong> ont le grand honneur de vous proclamer <strong>Lauréat officiel</strong> pour votre projet :</p>
          <div class="highlight-box">
            <strong>« ${variables.projectTitle || ''} »</strong><br />
            Référence : ${variables.reference || ''}<br />
            Distinction : ${variables.distinction || 'Lauréat du Concours'}
          </div>
          <p>Votre vision, la rigueur de votre prototype et l’utilité concrète démontrée par votre solution ont su convaincre les évaluateurs.</p>
          <p>L’équipe de direction de KevyLab va prendre contact directement avec vous pour convenir de la remise des distinctions et de l’accompagnement par le laboratoire.</p>
          <p>Avec toute l’admiration et la fierté du Lab.</p>`
        )
      };

    default:
      return {
        subject: variables.subject || '[KevyLab] Communication officielle',
        html: baseLayout(
          'Notification KevyLab',
          `<h2>Bonjour ${variables.candidateName || ''},</h2>
          <div style="white-space: pre-wrap;">${variables.message || ''}</div>`
        )
      };
  }
};
