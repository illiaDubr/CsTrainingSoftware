import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  const { error } = await resend.emails.send({
    from: 'Los Espada Training <onboarding@resend.dev>',
    to: email,
    subject: 'Восстановление пароля — Los Espada Training',
    html: `
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
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};