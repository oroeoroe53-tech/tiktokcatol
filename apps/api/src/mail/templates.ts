const wrapper = (title: string, bodyHtml: string) => `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px;background:#FAF9FF;font-family:Arial,sans-serif;color:#1A1830;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:32px;">
      <div style="font-size:22px;font-weight:700;color:#4338CA;margin-bottom:8px;">Faro</div>
      <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#6B6790;">
        Si no has solicitado esto, puedes ignorar este correo.
      </p>
    </div>
  </body>
</html>`;

export function verifyEmailTemplate(link: string): string {
  return wrapper(
    'Confirma tu correo',
    `<p>Gracias por unirte a Faro. Confirma tu correo para empezar tu camino de fe:</p>
     <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#F5A623;color:#14132B;border-radius:999px;text-decoration:none;font-weight:700;">Confirmar correo</a></p>
     <p style="font-size:13px;color:#6B6790;">O copia este enlace: ${link}</p>`,
  );
}

export function resetPasswordTemplate(link: string): string {
  return wrapper(
    'Recupera tu contraseña',
    `<p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
     <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#4338CA;color:#FFFFFF;border-radius:999px;text-decoration:none;font-weight:700;">Restablecer contraseña</a></p>
     <p style="font-size:13px;color:#6B6790;">Este enlace caduca en 1 hora. O copia este enlace: ${link}</p>`,
  );
}
