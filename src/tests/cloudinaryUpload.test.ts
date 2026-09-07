// Définition des variables de test obligatoires avant l'évaluation du module env.ts
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/kevylab_test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long!';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-characters-long!';
process.env.ADMIN_PW = 'test-admin-secret-pwd';

/**
 * ============================================================================
 * KEVYLAB — SUITE DE TESTS : STOCKAGE MÉDIA CLOUDINARY
 * ============================================================================
 * Vérifie le comportement nominal et résilient du service Cloudinary :
 * - Mode simulation / secours lorsque les clés ne sont pas encore renseignées
 * - Validation des dossiers cibles (laureates, projects, events)
 * - Gestion des suppressions et payloads d'image
 * ============================================================================
 */

const runTests = async () => {
  const { CloudinaryService } = await import('../integrations/cloudinary/cloudinaryService');

  console.log('[TEST] Service Médias Cloudinary');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${description}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${description}`);
      failed++;
    }
  };

  const service = new CloudinaryService();

  // 1. Rejet si la charge utile est vide
  try {
    await service.uploadImage('');
    assert(false, 'Doit lever une erreur si la charge utile est vide');
  } catch (err: any) {
    assert(err.statusCode === 400, 'Doit lever une erreur 400 Bad Request pour une image vide');
  }

  // 2. Téléversement en mode simulation (ou réel si configuré)
  try {
    const testDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await service.uploadImage(testDataUri, 'laureates');
    assert(typeof result.secureUrl === 'string' && result.secureUrl.length > 0, 'L’URL sécurisée retournée doit être valide');
    assert(typeof result.publicId === 'string' && result.publicId.length > 0, 'Le publicId retourné doit être valide');
  } catch (err: any) {
    assert(false, `Le téléversement d'image a échoué inopinément: ${err.message}`);
  }

  // 3. Suppression en mode simulation
  try {
    const deleted = await service.deleteImage('simulated-test-id');
    assert(deleted === true, 'La suppression doit renvoyer true en mode simulation');
  } catch (err: any) {
    assert(false, `La suppression a échoué: ${err.message}`);
  }

  console.log(`\n[BILAN] Bilan Cloudinary : ${passed} réussis, ${failed} échoués.\n`);
  if (failed > 0) process.exit(1);
};

runTests();
