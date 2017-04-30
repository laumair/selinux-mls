import isUndefined from 'lodash/isUndefined';
import split from 'lodash/split';
import trim from 'lodash/trim';
import Ssh from '../utils/Ssh';
import Socket from '../utils/Socket';
import { messages } from '../partials/index';
import config, { extras } from '../../../../../config';

/* eslint-disable no-console */

const delayFor = (time, cb) => setTimeout(() => cb(), time);

const isMLSConfigured = (ssh, socket) => {
  ssh.isMLSConfigured()
    .then((payload) => {
      const { stderr, stdout } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.SELINUX_MODE_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return isMLSConfigured(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      } else if (stdout) {
        socket.emitDefaultEvent(messages.MLS_CONFIGURED);
        return ssh.dispose();
      }

      return socket.emitDefaultEvent(messages.MLS_CONFIGURATION_ERROR);
    }).catch(err => console.error(err));
};

const waitForSecondReboot = (socket, sshObj) => {
  socket.emitDefaultEvent(messages.WAITING_TO_REBOOT);
  const ssh = isUndefined(sshObj) ? new Ssh() : sshObj;

  ssh.connect(config)
    .then(() => isMLSConfigured(ssh, socket))
    .catch(() => delayFor(500, () => waitForSecondReboot(socket, sshObj)));
};

const setEnforcingState = (ssh, socket) => {
  socket.emitDefaultEvent(messages.SETTING_SELINUX_TO_ENFORCING);
  ssh.setEnforcingState()
    .then((payload) => {
      const { stderr } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.SETTING_SELINUX_TO_ENFORCING_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return setEnforcingState(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      }
      socket.emitDefaultEvent(messages.SET_SELINUX_TO_ENFORCING_SUCCESS);

      return ssh.reboot().then(() => {
        delayFor(500, () => waitForSecondReboot(socket));
        ssh.dispose();
      });
    }).catch(err => console.log(err));
};

const checkLogs = (ssh, socket) => {
  socket.emitDefaultEvent(messages.CHECKING_LOGS);
  ssh.checkLogs()
    .then((payload) => {
      const { stdout, stderr } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.CHECKING_LOGS_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return checkLogs(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      } else if (!stdout) {
        socket.emitDefaultEvent(messages.NO_DENIAL_MESSAGES);
        return setEnforcingState(ssh, socket);
      }

      socket.emitDefaultEvent(messages.FOUND_DENIAL_MESSAGES);
      return ssh.dispose();
    });
};

const allowRootLoginViaSsh = (ssh, socket) => {
  socket.emitDefaultEvent(messages.TURNING_ON_BOOLEAN);
  ssh.allowRootSshLogin()
    .then((payload) => {
      const { stderr } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.TURNING_ON_BOOLEAN_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return allowRootLoginViaSsh(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      }

      socket.emitDefaultEvent(messages.BOOLEAN_TURNED_ON_SUCCESS);
      return checkLogs(ssh, socket);
    });
};

const waitForFirstReboot = (socket, sshObj) => {
  socket.emitDefaultEvent(messages.WAITING_TO_REBOOT);
  const ssh = isUndefined(sshObj) ? new Ssh() : sshObj;

  ssh.connect(config).then(() => {
    socket.emitDefaultEvent(messages.VERIFYING_BOOLEAN);
    ssh.verifyRootSshBool()
      .then((payload) => {
        const { stdout, stderr } = payload;
        if (stderr) {
          socket.emitDefaultEvent(messages.VERIFYING_BOOLEAN_ERROR);
          if (ssh.shouldRetry(extras.retries)) {
            socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
            ssh.incrementRetryAttempt();
            return waitForFirstReboot(socket, ssh);
          }

          ssh.dispose();
          return socket.emitDefaultEvent(messages.RETRIES_ENDED);
        }

        const mapped = split(stdout, '-->');
        if (trim(mapped[1]) === 'off') {
          socket.emitDefaultEvent(messages.SSH_SYSADM_BOOL_OFF);
          return allowRootLoginViaSsh(ssh, socket);
        }

        socket.emitDefaultEvent(messages.SSH_SYSADM_BOOL_ON);
        return checkLogs(ssh, socket);
      });
  }).catch(() => delayFor(500, () => waitForFirstReboot(socket, ssh)));
};

const ensureFilesRelabelling = (ssh, socket) => {
  socket.emitDefaultEvent(messages.AUTO_RELABELLING_PREP);
  ssh.ensureFilesRelabel()
    .then((payload) => {
      const { stderr } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.AUTO_RELABELLING_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return ensureFilesRelabelling(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      }

      socket.emitDefaultEvent(messages.AUTO_RELABELLING_PREP_SUCCESS);
      return ssh.reboot()
        .then(() => {
          socket.emitDefaultEvent(messages.REBOOTING);
          delayFor(100, () => waitForFirstReboot(socket));
          ssh.dispose();
        });
    }).catch(err => console.log(err));
};

const setSELinuxAsPermissiveWithMLS = (ssh, socket) => {
  socket.emitDefaultEvent(messages.SET_SELINUX_PERMISSIVE);
  socket.emitDefaultEvent(messages.SET_SELINUX_MODE_MLS);
  ssh.setPermissiveState()
    .then((payload) => {
      const { stderr } = payload;
      if (stderr) {
        socket.emitDefaultEvent(messages.SETTING_PERMISSIVE_MODE_ERROR);
        if (ssh.shouldRetry(extras.retries)) {
          socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
          ssh.incrementRetryAttempt();
          return setSELinuxAsPermissiveWithMLS(ssh, socket);
        }

        ssh.dispose();
        return socket.emitDefaultEvent(messages.RETRIES_ENDED);
      }

      socket.emitDefaultEvent(messages.PERMISSIVE_MLS_SUCCESSFULLY_SET);
      return ensureFilesRelabelling(ssh, socket);
    })
    .catch(() => {
      socket.emitDefaultEvent(messages.TERMINATING_SSH_CONN);
      ssh.dispose();
    });
};

const installMlsPackage = (payload, ssh, socket) => {
  const { stdout, stderr } = payload;
  if (stderr) {
    socket.emitDefaultEvent(messages.CHECKING_MLS_PACKAGE_ERROR);
    if (ssh.shouldRetry(extras.retries)) {
      socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
      ssh.incrementRetryAttempt();
      return installMlsPackage(payload, ssh, socket);
    }

    ssh.dispose();
    return socket.emitDefaultEvent(messages.RETRIES_ENDED);
  } else if (stdout) {
    socket.emitDefaultEvent(messages.MLS_ALREADY_INSTALLED);
    return setSELinuxAsPermissiveWithMLS(ssh, socket);
  }

  socket.emitDefaultEvent(messages.INSTALLING_MLS);
  return ssh.installMlsPackage().then((result) => {
    if (result.stderr) {
      socket.emitDefaultEvent(messages.MLS_INSTALLATION_ERROR);
      if (ssh.shouldRetry(extras.retries)) {
        socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
        ssh.incrementRetryAttempt();
        return installMlsPackage(payload, ssh, socket);
      }

      ssh.dispose();
      return socket.emitDefaultEvent(messages.RETRIES_ENDED);
    }

    socket.emitDefaultEvent(messages.MLS_INSTALLED);
    return setSELinuxAsPermissiveWithMLS(ssh, socket);
  });
};

const enableMLS = (ssh, socket) => {
  ssh.connect(config)
    .then(() => {
      ssh.isMLSConfigured()
        .then((payload) => {
          const { stdout } = payload;
          if (stdout) {
            socket.emitDefaultEvent(messages.MLS_ALREADY_CONFIGURED);
            socket.emitDefaultEvent(messages.TERMINATING_SSH_CONN);
            return ssh.dispose();
          }

          return ssh.verifyMlsPackage()
            .then((result) => {
              socket.emitDefaultEvent(messages.CHECK_FOR_MLS_PACKAGE);
              return installMlsPackage(result, ssh, socket);
            }).catch(err => console.log(err));
        });
    })
    .catch(() => {
      socket.emitDefaultEvent(messages.SSH_CONNECTION_ERROR);
      if (ssh.shouldRetry(extras.retries)) {
        socket.emitDefaultEvent(messages.RETRY_ATTEMPT(ssh.retries));
        delayFor(300, () => {
          enableMLS(ssh, socket);
          ssh.incrementRetryAttempt();
        });
      } else {
        socket.emitDefaultEvent(messages.RETRIES_ENDED);
      }
    });
};

const configureMLS = (req, res) => {
  const io = req.app.get('socketio');
  const socket = new Socket(io.sockets);
  const ssh = new Ssh();

  enableMLS(ssh, socket);

  res.sendStatus(200);
};

const getCredentials = (req, res) => res.jsonp(config);

export default { configureMLS, getCredentials };
