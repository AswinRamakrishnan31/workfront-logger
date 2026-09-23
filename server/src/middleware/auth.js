import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  // In corporate environment with SSO / Active Directory / Entra ID,
  // tokens are passed via Authorization: Bearer <token> or X-User-Email / X-SSO-Subject.
  const userEmail = req.headers['x-user-email'] || req.headers['authorization'] || 'admin@company.com';
  const userRole = req.headers['x-user-role'] || 'Admin';

  req.user = {
    id: 'usr-default-admin',
    email: userEmail,
    name: req.headers['x-user-name'] || 'System Admin',
    role: userRole,
    ssoProvider: req.headers['x-sso-provider'] || 'AzureAD'
  };

  next();
};

export default authenticate;
