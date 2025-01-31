const notifier = require('mail-notifier');
const axios = require('axios');
const logger = require('tracer').colorConsole({ format: '[{{timestamp}} {{title}}] (in {{file}}:{{line}}) {{message}}', level: process.env.LOG_LEVEL || 'info' });

const usernames = process.env.IMAP_USERNAMES.split(",");
const passwords = process.env.IMAP_PASSWORDS.split(",");
const githubURL = process.env.DISCORD_WH_URL;
const imapMarkSeen = process.env.IMAP_MARK_SEEN === "false" ? false : true;

const startTime = new Date();

const triggerWebhook = (username, mail) => {
    logger.debug(mail)
    const description = mail.text === undefined ? "" : mail.text.substring(0, 1000);

    if (!imapMarkSeen && mail.date < startTime) {
      return;
    }
    const payload = {
      username: username,
      embeds: [
        {
          title: mail.headers.subject,
          author: {
            name: mail.headers.from
          },
          description: description
        }
      ]
    };
    logger.debug(payload)
    require("axios").post(githubURL, payload).then((response) => {
    }).catch((err) => {
      logger.error("Error triggering Webhook:" + err);
      logger.error(err.response);
    });
}

logger.info("Log level: " + process.env.LOG_LEVEL || "info")
logger.info("IMAP Host: " + process.env.IMAP_HOST);
logger.info("IMAP Port: " + process.env.IMAP_PORT || 141);
logger.info("IMAP Check TLS: " + (process.env.IMAP_TLS || "true"));
logger.info("IMAP Check TLS: " + (process.env.IMAP_MARK_SEEN || "false"));


usernames.forEach((username, index) => {
    const imap = {
        user: username,
        password: passwords[index],
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT || 143,
        tls: process.env.IMAP_TLS === "true" ? true : false,
        autotls: 'always',
        markSeen: imapMarkSeen
    };

    notifier(imap)
        .on('connected',() => {
          logger.info("Connected " + username + ". Listening for emails.");
        })
        .on('error', (e) => {
          logger.error("Failed to connect with " + username, e)
          throw e;
        })
        .on('mail', (mail) => triggerWebhook(username, mail))
    .start();
})





