import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { EnvConfig } from '../config/env.validation';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envío de email transaccional. Si no hay SMTP configurado (no hay credenciales
 * en este entorno), cae a un transporte de desarrollo que escribe el correo en
 * storage/dev-outbox/ y lo registra en consola — así el flujo de registro /
 * verificación / recuperación de contraseña se puede probar de extremo a extremo
 * sin depender de un proveedor externo.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly devOutboxDir = path.join(process.cwd(), 'storage', 'dev-outbox');

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    const host = this.config.get('SMTP_HOST', { infer: true });
    const port = this.config.get('SMTP_PORT', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    const pass = this.config.get('SMTP_PASS', { infer: true });
    this.from = this.config.get('SMTP_FROM', { infer: true });

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configurado (${host}:${port})`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP no configurado: los emails se escribirán en storage/dev-outbox/ y en consola (modo desarrollo)',
      );
    }
  }

  async send({ to, subject, html }: SendMailInput): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      return;
    }
    await this.writeDevOutbox({ to, subject, html });
  }

  private async writeDevOutbox({ to, subject, html }: SendMailInput): Promise<void> {
    await fs.mkdir(this.devOutboxDir, { recursive: true });
    const fileName = `${Date.now()}-${to.replace(/[^a-z0-9]/gi, '_')}.html`;
    const filePath = path.join(this.devOutboxDir, fileName);
    await fs.writeFile(
      filePath,
      `<!-- To: ${to} | Subject: ${subject} -->\n${html}`,
      'utf-8',
    );
    this.logger.log(`[DEV MAIL] Para: ${to} | Asunto: ${subject} | Guardado en ${filePath}`);
  }
}
