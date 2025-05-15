import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hashSync } from 'bcryptjs'
import request from 'supertest'

describe('Authenticate (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    await app.init()
  })

  test('[POST] /sessions', async () => {
    const passwordHash = await hashSync('123456789@Aa')
    await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: passwordHash,
      },
    })

    const res = await request(app.getHttpServer()).post('/sessions').send({
      email: 'johndoe@gmail.com',
      password: '123456789@Aa',
    })

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({
      access_token: expect.any(String),
    })
  })
})
