// Configuration de l'environnement de test isolé
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/kevylab_test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long!';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-characters-long!';
process.env.ADMIN_PW = 'test-admin-secret-master-key';

/**
 * ============================================================================
 * KEVYLAB — SUITE DE TESTS : AUTHENTIFICATION ADMINISTRATIVE GOOGLE OAUTH 2.0
 * ============================================================================
 * Vérifie la rigueur de la validation des jetons Google, l'interdiction
 * d'inscription non autorisée sans clé maître ADMIN_PW et la sécurité des accès.
 * ============================================================================
 */

const runTests = async () => {
  const { authService } = await import('../services/authService');
  const { AdminUserModel } = await import('../models/AdminUser');

  console.log('[TEST] Authentification Google Staff');
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

  // 1. Rejet si le jeton est manquant ou vide
  try {
    await authService.loginWithGoogle('');
    assert(false, 'Doit refuser un jeton Google vide');
  } catch (err: any) {
    assert(err.statusCode === 400, 'Doit renvoyer une erreur 400 pour un idToken vide');
  }

  // 2. Formatage d'un jeton Google simulé (header.payload.signature)
  const fakeGooglePayload = {
    email: 'staff.mentor@kevylab.com',
    given_name: 'Lead',
    family_name: 'Architect',
    sub: 'google-sub-123456789'
  };
  const fakeToken = `header.${Buffer.from(JSON.stringify(fakeGooglePayload)).toString('base64')}.signature`;

  // 3. Mock isolé de findOne pour éviter toute latence réseau ou socket Mongoose
  (AdminUserModel as any).findOne = async () => null;

  // 4. Rejet si le compte n'existe pas et qu'aucun ADMIN_PW valide n'est fourni
  try {
    await authService.loginWithGoogle(fakeToken, 'mauvais-secret');
    assert(false, 'Doit refuser la création sans la clé maître valide');
  } catch (err: any) {
    assert(err.statusCode === 401, 'Doit renvoyer une erreur 401 si le compte est absent et sans clé maître valide');
  }

  // 5. Validation du rejet si aucun token payload valide
  try {
    await authService.loginWithGoogle('invalid-malformed-token');
    assert(false, 'Doit refuser un token Google malformé');
  } catch (err: any) {
    assert(err.statusCode === 400, 'Doit renvoyer une erreur 400 pour token malformé');
  }

  console.log(`\n[BILAN] Bilan Google Auth : ${passed} réussis, ${failed} échoués.\n`);
  if (failed > 0) process.exit(1);
};

runTests();
