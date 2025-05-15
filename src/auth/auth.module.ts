import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Env } from '@/env'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: async (config: ConfigService<Env, true>) => {
        const privateKey = config.get('JWT_PRIVATE_KEY', { infer: true })

        const publicKey = config.get('JWT_PUBLIC_KEY', { infer: true })

        const toBuffer = (buffer: string) =>
          Buffer.from(buffer, 'base64').toString()

        return {
          signOptions: { algorithm: 'RS256' },
          privateKey: toBuffer(privateKey),
          publicKey: toBuffer(publicKey),
        }
      },
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
