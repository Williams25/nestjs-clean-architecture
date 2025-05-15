import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'
import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type IAuthenticateBody = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: IAuthenticateBody) {
    const { email, password } = body

    const user = await this.prisma.user.findUnique({ where: { email: email } })
    if (!user) throw new UnauthorizedException('User credentials do not match.')

    const isPassword = await compare(password, user.password)
    if (!isPassword)
      throw new UnauthorizedException('User credentials do not match.')

    const accessToken = this.jwt.sign({ sub: user.id, email })

    return {
      access_token: accessToken,
    }
  }
}
