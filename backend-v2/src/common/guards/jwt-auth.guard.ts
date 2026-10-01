import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Equivalent of legacy middleware/auth.js `auth` middleware.
 * Verifies the Bearer token via the JwtStrategy and attaches the
 * decoded payload to `req.user`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
