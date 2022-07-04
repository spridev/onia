module.exports = {
  /**
   * Run tests serially.
   */
  serial: true,

  /**
   * The files extensions.
   */
  extensions: [
    'ts'
  ],

  /**
   * The external modules.
   */
  require: [
    'ts-node/register/transpile-only'
  ]
};
