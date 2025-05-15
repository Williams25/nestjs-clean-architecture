import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '@/auth/current-user-decorator'
import { JwtAuthGuard } from '@/auth/jwt.auth.guard'
import { UserPayload } from '@/auth/jwt.strategy'
import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'

const pageQueryParamsSchema = (dafault: string = '1') =>
  z
    .string()
    .optional()
    .default(dafault)
    .transform(Number)
    .pipe(z.number().min(1))

const queryValidationPipe = (dafault: string = '1') =>
  new ZodValidationPipe(pageQueryParamsSchema(dafault))

const queryParamsSchema = pageQueryParamsSchema()

type PageQueryParamSchema = z.infer<typeof queryParamsSchema>

@Controller('/questions')
export class FetchRecentQuestionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe()) page: PageQueryParamSchema,
    @Query('perPage', queryValidationPipe('5')) perPage: PageQueryParamSchema,
  ) {
    const totalQuestions = await this.prisma.question.count()
    const totalPages = Math.ceil(totalQuestions / perPage)
    const remainingPages = totalPages - page

    const questions = await this.prisma.question.findMany({
      take: perPage,
      skip: (page - 1) * perPage,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      questions,
      pagination: {
        remaining_pages: remainingPages,
        total_questions: totalQuestions,
        per_page: questions.length,
        page,
      },
    }
  }
}
