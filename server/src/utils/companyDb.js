// server/src/utils/companyDb.js
const COMPANY_DB_ENV = {
  SFC: 'DB_SFC',
  FEEDPRO: 'DB_FEEDPRO',
  PET1: 'DB_PET1',
};

function getCompanyDbName(company) {
  const envKey = COMPANY_DB_ENV[(company || '').toUpperCase()];
  return (envKey && process.env[envKey]) || process.env.DB_GDB || 'GDB';
}

module.exports = { getCompanyDbName, COMPANY_DB_ENV };
