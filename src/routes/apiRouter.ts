import { Router } from 'express';
import { authController } from '../controllers/authController';
import { projectController } from '../controllers/projectController';
import { eventController } from '../controllers/eventController';
import { submissionController } from '../controllers/submissionController';
import { contactController } from '../controllers/contactController';
import { faqController } from '../controllers/faqController';
import { adminDashboardController } from '../controllers/adminDashboardController';
import { uploadController } from '../controllers/uploadController';
import { requireAuth, requirePermission } from '../middlewares/authMiddleware';
import { authLimiter, submissionLimiter, contactLimiter } from '../middlewares/rateLimiter';
import { checkIdempotency } from '../utils/idempotency';
import { EmailLogModel } from '../models/EmailLog';
import { LabProjectModel } from '../models/LabProject';
import { EventModel } from '../models/Event';
import { emailService } from '../services/emailService';
import { sendSuccess } from '../utils/apiResponse';

/**
 * ============================================================================
 * KEVYLAB — ROUTEUR CENTRAL DE L'API REST (/api/v1)
 * ============================================================================
 * Déclare l'intégralité des routes publiques du Lab/Événements et les routes
 * d'administration protégées par RBAC et limitation de débit.
 * ============================================================================
 */

export const apiRouter = Router();

// --- 1. Routes Publiques : Projets du Lab ---
apiRouter.get('/projects', projectController.getPublicProjects.bind(projectController));
apiRouter.get('/projects/:slug', projectController.getPublicProjectBySlug.bind(projectController));

// --- 2. Routes Publiques : Événements & Appathon ---
apiRouter.get('/events', eventController.getPublicEvents.bind(eventController));
apiRouter.get('/events/active', eventController.getActiveAppathon.bind(eventController));
apiRouter.get('/events/:slug', eventController.getPublicEventBySlug.bind(eventController));
apiRouter.get('/events/:eventId/evaluation-criteria', eventController.getCriteria.bind(eventController));
apiRouter.get('/events/:eventId/winners', eventController.getEventWinners.bind(eventController));

// --- 3. Routes Publiques : Candidatures ---
apiRouter.post(
  '/events/:eventId/submissions',
  submissionLimiter,
  checkIdempotency,
  submissionController.submitApplication.bind(submissionController)
);

// --- 4. Routes Publiques : Contact ---
apiRouter.post('/contact', contactLimiter, contactController.submitContact.bind(contactController));

// --- 5. Routes Publiques : Foire Aux Questions (FAQ) ---
apiRouter.get('/faqs', faqController.getGlobalFaqs.bind(faqController));
apiRouter.get('/events/:eventId/faqs', faqController.getEventFaqs.bind(faqController));

// --- 6. Routes Administratives : Authentification ---
apiRouter.post('/admin/auth/register', authLimiter, authController.register.bind(authController));
apiRouter.post('/admin/auth/login', authLimiter, authController.login.bind(authController));
apiRouter.post('/admin/auth/google', authLimiter, authController.loginGoogle.bind(authController));
apiRouter.post('/admin/auth/refresh', authController.refresh.bind(authController));
apiRouter.post('/admin/auth/logout', authController.logout.bind(authController));
apiRouter.get('/admin/auth/me', requireAuth, authController.getMe.bind(authController));

// --- 7. Routes Administratives : Dashboard & Métriques ---
apiRouter.get(
  '/admin/dashboard',
  requireAuth,
  adminDashboardController.getStats.bind(adminDashboardController)
);

// --- 8. Routes Administratives : Candidatures & Évaluation ---
apiRouter.get(
  '/admin/submissions',
  requireAuth,
  requirePermission('submissions.read'),
  submissionController.getSubmissions.bind(submissionController)
);
apiRouter.get(
  '/admin/submissions/:id',
  requireAuth,
  requirePermission('submissions.read'),
  submissionController.getSubmissionById.bind(submissionController)
);
apiRouter.patch(
  '/admin/submissions/:id/status',
  requireAuth,
  requirePermission('submissions.change_status'),
  submissionController.changeStatus.bind(submissionController)
);
apiRouter.put(
  '/admin/submissions/:id/review',
  requireAuth,
  requirePermission('submissions.review'),
  submissionController.submitReview.bind(submissionController)
);
apiRouter.post(
  '/admin/submissions/:id/email',
  requireAuth,
  requirePermission('emails.send'),
  submissionController.sendManualEmail.bind(submissionController)
);

// --- 9. Routes Administratives : Projets du Lab ---
apiRouter.get(
  '/admin/projects',
  requireAuth,
  requirePermission('projects.manage'),
  async (_req, res, next) => {
    try {
      const projects = await LabProjectModel.find().sort({ createdAt: -1 }).lean();
      sendSuccess(res, projects);
    } catch (error) {
      next(error);
    }
  }
);
apiRouter.post(
  '/admin/projects',
  requireAuth,
  requirePermission('projects.manage'),
  projectController.createProject.bind(projectController)
);
apiRouter.patch(
  '/admin/projects/:id',
  requireAuth,
  requirePermission('projects.manage'),
  projectController.updateProject.bind(projectController)
);
apiRouter.delete(
  '/admin/projects/:id',
  requireAuth,
  requirePermission('projects.manage'),
  projectController.deleteProject.bind(projectController)
);

// --- 10. Routes Administratives : Événements & Résultats ---
apiRouter.get(
  '/admin/events',
  requireAuth,
  requirePermission('events.manage'),
  async (_req, res, next) => {
    try {
      const events = await EventModel.find().sort({ createdAt: -1 }).lean();
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  }
);
apiRouter.post(
  '/admin/events',
  requireAuth,
  requirePermission('events.manage'),
  eventController.createEvent.bind(eventController)
);
apiRouter.patch(
  '/admin/events/:id',
  requireAuth,
  requirePermission('events.manage'),
  eventController.updateEvent.bind(eventController)
);
apiRouter.put(
  '/admin/events/:eventId/evaluation-criteria',
  requireAuth,
  requirePermission('events.manage'),
  eventController.setCriteria.bind(eventController)
);
apiRouter.post(
  '/admin/events/:id/publish-results',
  requireAuth,
  requirePermission('events.manage'),
  eventController.publishResults.bind(eventController)
);

// --- 11. Routes Administratives : Messages de Contact ---
apiRouter.get(
  '/admin/contacts',
  requireAuth,
  requirePermission('contacts.read'),
  contactController.getContacts.bind(contactController)
);
apiRouter.patch(
  '/admin/contacts/:id',
  requireAuth,
  requirePermission('contacts.read'),
  contactController.updateContactStatus.bind(contactController)
);

// --- 12. Routes Administratives : Logs de Courriels & Réessai ---
apiRouter.get(
  '/admin/email-logs',
  requireAuth,
  requirePermission('emails.send'),
  async (_req, res, next) => {
    try {
      const logs = await EmailLogModel.find().sort({ createdAt: -1 }).limit(50).lean();
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
);
apiRouter.post(
  '/admin/email-logs/:id/retry',
  requireAuth,
  requirePermission('emails.send'),
  async (req, res, next) => {
    try {
      const updatedLog = await emailService.retryEmail(req.params.id as string);
      sendSuccess(res, updatedLog);
    } catch (error) {
      next(error);
    }
  }
);

// --- 13. Routes Administratives : FAQ ---
apiRouter.get(
  '/admin/faqs',
  requireAuth,
  requirePermission('events.manage'),
  faqController.getAllFaqsAdmin.bind(faqController)
);
apiRouter.post(
  '/admin/faqs',
  requireAuth,
  requirePermission('events.manage'),
  faqController.createFaq.bind(faqController)
);
apiRouter.patch(
  '/admin/faqs/:id',
  requireAuth,
  requirePermission('events.manage'),
  faqController.updateFaq.bind(faqController)
);
apiRouter.delete(
  '/admin/faqs/:id',
  requireAuth,
  requirePermission('events.manage'),
  faqController.deleteFaq.bind(faqController)
);

// --- 14. Routes Administratives : Médias & Cloudinary ---
apiRouter.post(
  '/upload/image',
  requireAuth,
  uploadController.uploadImage.bind(uploadController)
);
apiRouter.delete(
  '/upload/image',
  requireAuth,
  uploadController.deleteImage.bind(uploadController)
);

