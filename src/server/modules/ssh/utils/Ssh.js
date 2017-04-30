/* eslint-disable camelcase */
/* eslint-disable new-cap */

import node_ssh from 'node-ssh';
import { cmd } from '../partials/index';

export default class Ssh {
  constructor() {
    this.connection = new node_ssh();
    this.retries = 0;
  }

  verifyMlsPackage() {
    return this.run(cmd.HAS_MLS_PACKAGE);
  }

  verifyRootSshBool() {
    return this.run(cmd.IS_ROOT_ALLOWED_SSH_LOGIN);
  }

  checkLogs() {
    return this.run(cmd.HAS_DENIAL_MESSAGES);
  }

  installMlsPackage() {
    return this.run(cmd.INSTALL_MLS_PACKAGE);
  }

  setPermissiveState() {
    return this.run(cmd.SET_SE_CONFIG_PERMISSIVE);
  }

  setEnforcingState() {
    return this.run(cmd.SET_SE_CONFIG_ENFORCING);
  }

  ensureFilesRelabel() {
    return this.run(cmd.AUTO_RELABEL_FILES);
  }

  reboot() {
    return this.run(cmd.REBOOT);
  }

  isMLSConfigured() {
    return this.run(cmd.IS_MLS_CONFIGURED);
  }

  dispose() {
    return this.connection.dispose();
  }

  allowRootSshLogin() {
    return this.run(cmd.ALLOW_ROOT_SSH_LOGIN);
  }

  shouldRetry(maxRetries) {
    return this.retries < maxRetries;
  }

  incrementRetryAttempt() {
    this.retries += 1;
  }

  resetRetries() {
    this.retries = 0;
  }

  connect(config) {
    return this.connection.connect(config);
  }

  run(command) {
    if (!this.retries) {
      this.resetRetries();
    }

    return this.connection.execCommand(command);
  }
}
