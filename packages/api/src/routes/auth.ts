import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import {
  registerSchema,
  residentRegisterSchema,
  workerRegisterSchema,
  verifyCodeSchema,
  resendCodeSchema,
  loginSchema,
  ActivityAction,
  AccountStatus,
  Role,
} from '@ekonaryn/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { generateTokens, verifyRefreshToken } from '../utils/tokens';
import { upload } from '../utils/upload';
import { generateCode, codeExpiry, isCodeValid, shouldExposeCode } from '../utils/verification';
import { logActivity } from '../services/activityLog';
import { AppError } from '../middleware/error';

const router = Router();

function publicUser(u: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: string;
  address?: string | null;
  points: number;
  accountStatus: string;
  phoneVerifiedAt?: Date | null;
  emailVerifiedAt?: Date | null;
  onShift?: boolean;
}) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email ?? null,
    role: u.role,
    address: u.address ?? null,
    points: u.points,
    accountStatus: u.accountStatus,
    phoneVerifiedAt: u.phoneVerifiedAt ?? null,
    emailVerifiedAt: u.emailVerifiedAt ?? null,
    onShift: u.onShift ?? false,
  };
}

// ============================================================================
// Resident registration (legacy + new path)
// ============================================================================

// Legacy /auth/register — accepts the old payload (name/phone/password/address)
// and creates a resident. Preserved so existing mobile builds keep working.
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, phone, password, address } = req.body;

      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) throw new AppError('Phone number already registered', 409);

      const hashedPassword = await bcrypt.hash(password, 10);
      const code = generateCode();
      const user = await prisma.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          address,
          role: Role.RESIDENT,
          accountStatus: AccountStatus.ACTIVE,
          verificationCode: code,
          verificationCodeExpiresAt: codeExpiry(),
        },
      });

      const tokens = generateTokens({
        userId: user.id,
        role: user.role,
        accountStatus: user.accountStatus,
      });

      res.status(201).json({
        success: true,
        data: {
          user: publicUser(user),
          ...tokens,
          ...(shouldExposeCode() ? { verificationCode: code } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/register/resident',
  validate(residentRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, phone, email, password, address } = req.body;

      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) throw new AppError('Phone number already registered', 409);
      if (email) {
        const emailTaken = await prisma.user.findUnique({ where: { email } });
        if (emailTaken) throw new AppError('Email already registered', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const code = generateCode();
      const user = await prisma.user.create({
        data: {
          name,
          phone,
          email,
          password: hashedPassword,
          address,
          role: Role.RESIDENT,
          accountStatus: AccountStatus.ACTIVE,
          verificationCode: code,
          verificationCodeExpiresAt: codeExpiry(),
        },
      });

      const tokens = generateTokens({
        userId: user.id,
        role: user.role,
        accountStatus: user.accountStatus,
      });

      res.status(201).json({
        success: true,
        data: {
          user: publicUser(user),
          ...tokens,
          ...(shouldExposeCode() ? { verificationCode: code } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Worker registration (multipart so we can capture the ID document upload)
// ============================================================================

// Multer hands every text field over as a string. workerRegisterSchema expects
// serviceAreas: string[] and vehicleCapacityKg: number, so we normalize the
// body shape BEFORE validate() runs — a separate middleware keeps the route
// handler clean and surfaces zod's field-level errors via the standard 400.
const coerceWorkerRegisterBody = (req: Request, _res: Response, next: NextFunction) => {
  const rawAreas = req.body?.serviceAreas;
  const serviceAreas = Array.isArray(rawAreas)
    ? rawAreas
    : typeof rawAreas === 'string' && rawAreas.trim().startsWith('[')
      ? JSON.parse(rawAreas)
      : typeof rawAreas === 'string'
        ? rawAreas
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

  req.body = {
    ...req.body,
    email: req.body?.email || undefined,
    serviceAreas,
    vehicleCapacityKg:
      req.body?.vehicleCapacityKg != null && req.body.vehicleCapacityKg !== ''
        ? parseFloat(req.body.vehicleCapacityKg)
        : undefined,
  };
  next();
};

router.post(
  '/register/worker',
  upload.single('idDocument'),
  coerceWorkerRegisterBody,
  validate(workerRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = req.body;

      if (!req.file) throw new AppError('ID document upload is required', 400);

      const existing = await prisma.user.findUnique({ where: { phone: parsed.phone } });
      if (existing) throw new AppError('Phone number already registered', 409);
      if (parsed.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: parsed.email } });
        if (emailTaken) throw new AppError('Email already registered', 409);
      }

      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const code = generateCode();
      const user = await prisma.user.create({
        data: {
          name: parsed.name,
          phone: parsed.phone,
          email: parsed.email,
          password: hashedPassword,
          role: Role.WORKER,
          accountStatus: AccountStatus.PENDING_APPROVAL,
          idNumber: parsed.idNumber,
          idDocumentUrl: `/uploads/${req.file.filename}`,
          serviceAreas: JSON.stringify(parsed.serviceAreas),
          vehicleType: parsed.vehicleType,
          vehiclePlate: parsed.vehiclePlate,
          vehicleCapacityKg: parsed.vehicleCapacityKg,
          maxConcurrentOrders: 5,
          onShift: false,
          verificationCode: code,
          verificationCodeExpiresAt: codeExpiry(),
        },
      });

      await logActivity(req, ActivityAction.WORKER_REGISTERED, 'user', user.id, {
        phone: user.phone,
        serviceAreas: parsed.serviceAreas,
        vehicleType: parsed.vehicleType,
      });

      // Note: no tokens issued. The worker must wait for approval before logging in.
      res.status(201).json({
        success: true,
        data: {
          user: publicUser(user),
          message:
            'Your application is under review. You will be notified once an admin approves it.',
          ...(shouldExposeCode() ? { verificationCode: code } : {}),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Verification
// ============================================================================

router.post(
  '/verify',
  validate(verifyCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) throw new AppError('Account not found', 404);
      if (!isCodeValid(user.verificationCode, user.verificationCodeExpiresAt, code)) {
        throw new AppError('Invalid or expired verification code', 400);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerifiedAt: new Date(),
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });

      res.json({ success: true, message: 'Phone verified' });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/verify/resend',
  validate(resendCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) throw new AppError('Account not found', 404);

      const code = generateCode();
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: code, verificationCodeExpiresAt: codeExpiry() },
      });

      res.json({
        success: true,
        message: 'Verification code regenerated',
        ...(shouldExposeCode() ? { data: { verificationCode: code } } : {}),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Login
// ============================================================================

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;

      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user || user.deletedAt) {
        throw new AppError('Invalid phone or password', 401);
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await logActivity(req, ActivityAction.AUTH_LOGIN_BLOCKED, 'user', user.id, {
          reason: 'invalid_password',
        });
        throw new AppError('Invalid phone or password', 401);
      }

      if (user.accountStatus !== AccountStatus.ACTIVE) {
        const ctx = { actorId: user.id, actorRole: user.role };
        await logActivity(
          {
            ...ctx,
            ...{
              ipAddress: req.socket?.remoteAddress ?? null,
              userAgent: req.headers['user-agent'] as string,
            },
          },
          ActivityAction.AUTH_LOGIN_BLOCKED,
          'user',
          user.id,
          {
            reason: 'account_status',
            accountStatus: user.accountStatus,
          },
        );
        const messages: Record<string, string> = {
          PENDING_APPROVAL:
            'Your application is under review. Please wait for an admin to approve your account.',
          REJECTED: user.statusReason
            ? `Your application was rejected: ${user.statusReason}`
            : 'Your application was rejected.',
          SUSPENDED: user.statusReason
            ? `Your account is suspended: ${user.statusReason}`
            : 'Your account is suspended.',
        };
        throw new AppError(messages[user.accountStatus] || 'Account is not active', 403);
      }

      const tokens = generateTokens({
        userId: user.id,
        role: user.role,
        accountStatus: user.accountStatus,
      });
      await logActivity(req, ActivityAction.AUTH_LOGIN, 'user', user.id, { role: user.role });

      res.json({
        success: true,
        data: {
          user: publicUser(user),
          ...tokens,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Refresh & me
// ============================================================================

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const payload = verifyRefreshToken(refreshToken);

    // Re-read the account so a suspended/rejected user can't refresh into a fresh access token.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, accountStatus: true, deletedAt: true },
    });
    if (!user || user.deletedAt) throw new AppError('Account no longer exists', 401);
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new AppError('Account is not active', 403);
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      accountStatus: user.accountStatus,
    });
    res.json({ success: true, data: tokens });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid refresh token', 401));
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        address: true,
        points: true,
        accountStatus: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        onShift: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
