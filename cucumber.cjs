/** @type {import('@cucumber/cucumber/lib/configuration/types').IConfiguration} */

module.exports = {
  default: {
    paths: ['bdd/features/**/*.feature'],
    requireModule: ['ts-node/register', 'dotenv'],
    require: ['bdd/support/world.ts', 'bdd/step_definitions/**/*.ts', 'bdd/support/setup.ts'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true
  }
}
