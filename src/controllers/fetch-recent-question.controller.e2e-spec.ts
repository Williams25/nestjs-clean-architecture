import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { hashSync } from 'bcryptjs'
import request from 'supertest'

describe('Fetch recent questions (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    await app.init()
  })

  test('[GET] /questions', async () => {
    const passwordHash = await hashSync('123456789@Aa')
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: passwordHash,
      },
    })

    const accessToken = jwt.sign({ sub: user.id, email: user.email })

    const createDataQuestions = (userId: string) => {
      return '*'
        .repeat(10)
        .split('')
        .map((_, index) => ({
          authorId: userId,
          content: `Content ${index}`,
          title: `Title ${index}`,
          slug: `title-${index}`,
        }))
    }

    await prisma.question.createMany({
      data: createDataQuestions(user.id),
    })

    const res = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'New Question',
        content: 'Question content',
      })

    expect(res.statusCode).toBe(200)

    const perPage = 5
    const expectedQuestions = createDataQuestions(user.id)
      .slice(0, perPage)
      .map((question) => expect.objectContaining({ title: question.title }))

    expect(res.body).toEqual({
      questions: expectedQuestions,
      pagination: {
        page: expect.any(Number),
        per_page: expect.any(Number),
        remaining_pages: expect.any(Number),
        total_questions: expect.any(Number),
      },
    })
  })
})
