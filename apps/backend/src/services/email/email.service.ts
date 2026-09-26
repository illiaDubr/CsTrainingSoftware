import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client,
});

const encodeMessage = (message: string) => {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  const fromEmail = process.env.GMAIL_FROM;

  if (!fromEmail) {
    throw new Error('GMAIL_FROM is not configured');
  }

  const subject = 'Восстановление пароля — Los Espada Training';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Восстановление пароля</h2>

      <p>
        Мы получили запрос на восстановление пароля
        для вашего аккаунта Los Espada Training.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #ef4444;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          "
        >
          Сбросить пароль
        </a>
      </p>

      <p>Ссылка действительна 30 минут.</p>

      <p>
        Если вы не запрашивали восстановление пароля,
        просто проигнорируйте это письмо.
      </p>
    </div>
  `;

  const encodedSubject =
    `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const message = [
    `From: Los Espada Training <${fromEmail}>`,
    `To: ${email}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodeMessage(message),
    },
  });
};