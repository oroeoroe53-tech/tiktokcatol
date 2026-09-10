import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

function buildConfigMock(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    MIN_AGE: 13,
    JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN_DAYS: 30,
    APP_URL: 'http://localhost:3000',
    MOBILE_DEEP_LINK_BASE: 'faro://',
    ...overrides,
  };
  return { get: (key: string) => values[key] };
}

function buildDeps() {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    device: { create: jest.fn() },
    verificationToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };
  const jwt = { sign: jest.fn(() => 'signed.jwt.token') };
  const mail = { send: jest.fn() };
  const config = buildConfigMock();

  const service = new AuthService(prisma as any, jwt as any, mail as any, config as any);
  return { service, prisma, jwt, mail };
}

describe('AuthService.register', () => {
  it('rechaza el registro de menores de la edad mínima configurada', async () => {
    const { service, prisma } = buildDeps();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    await expect(
      service.register(
        {
          email: 'nino@example.com',
          username: 'nino',
          displayName: 'Niño',
          password: 'Password1',
          dateOfBirth: tenYearsAgo.toISOString(),
          locale: 'es',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rechaza el registro si el email o username ya existen', async () => {
    const { service, prisma } = buildDeps();
    prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });
    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 25);

    await expect(
      service.register(
        {
          email: 'dup@example.com',
          username: 'dup',
          displayName: 'Dup',
          password: 'Password1',
          dateOfBirth: adult.toISOString(),
          locale: 'es',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('crea el usuario con la contraseña hasheada (nunca en texto plano)', async () => {
    const { service, prisma } = buildDeps();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({
      id: 'new-user',
      email: data.email,
      username: data.username,
      role: 'USER',
      passwordHash: data.passwordHash,
    }));
    prisma.verificationToken.create.mockResolvedValue({ id: 'token-1' });
    prisma.session.create.mockResolvedValue({ id: 'session-1' });

    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 30);

    const result = await service.register(
      {
        email: 'nuevo@example.com',
        username: 'nuevo',
        displayName: 'Nuevo Usuario',
        password: 'Password1',
        dateOfBirth: adult.toISOString(),
        locale: 'es',
      },
      {},
    );

    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe('Password1');
    expect(await bcrypt.compare('Password1', createCall.data.passwordHash)).toBe(true);
    expect(result.user.email).toBe('nuevo@example.com');
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toContain('session-1.');
  });
});

describe('AuthService.login', () => {
  it('rechaza credenciales inválidas cuando el usuario no existe', async () => {
    const { service, prisma } = buildDeps();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@example.com', password: 'x' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza credenciales inválidas cuando la contraseña no coincide', async () => {
    const { service, prisma } = buildDeps();
    const passwordHash = await bcrypt.hash('correcta', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      passwordHash,
      status: 'ACTIVE',
      role: 'USER',
    });

    await expect(
      service.login({ email: 'a@example.com', password: 'incorrecta' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza el login de cuentas no activas', async () => {
    const { service, prisma } = buildDeps();
    const passwordHash = await bcrypt.hash('correcta', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      passwordHash,
      status: 'SUSPENDED',
      role: 'USER',
    });

    await expect(
      service.login({ email: 'a@example.com', password: 'correcta' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('emite tokens cuando las credenciales son correctas', async () => {
    const { service, prisma } = buildDeps();
    const passwordHash = await bcrypt.hash('correcta', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      passwordHash,
      status: 'ACTIVE',
      role: 'USER',
    });
    prisma.user.update.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({ id: 'session-42' });

    const result = await service.login({ email: 'a@example.com', password: 'correcta' }, {});
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBe('session-42.'.concat(result.refreshToken.split('.')[1]!));
  });
});
