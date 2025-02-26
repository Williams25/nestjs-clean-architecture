import { Body, ConflictException, Controller, Post } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { PrismaService } from 'src/prisma/prisma.service'

export interface ICreateAccountBody {
  name: string
  email: string
  password: string
}

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createAccount(@Body() body: ICreateAccountBody) {
    const { name, email, password } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: { email },
    })

    if (userWithSameEmail)
      throw new ConflictException('User with same email already exists.')

    const hashedPassword = await hash(password, 8)

    await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })
  }
}
