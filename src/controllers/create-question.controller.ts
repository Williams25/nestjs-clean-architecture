import { PrismaService } from '@/prisma/prisma.service'
import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '@/auth/current-user-decorator'
import { JwtAuthGuard } from '@/auth/jwt.auth.guard'
import { UserPayload } from '@/auth/jwt.strategy'
import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'
import { z } from 'zod'

const createQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
})

export type ICreateQuestionBody = z.infer<typeof createQuestionBodySchema>

@Controller('/questions')
@UseGuards(JwtAuthGuard)
export class CreateQuestionController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(
    @Body(new ZodValidationPipe(createQuestionBodySchema))
    body: ICreateQuestionBody,
    @CurrentUser() user: UserPayload,
  ) {
    const { content, title } = body

    let slug = this.convertToSlug(title)

    const questionWithSameSlug = await this.prisma.question.findFirst({
      where: { slug },
    })

    if (questionWithSameSlug) {
      slug = this.convertToDuplicateSlug(slug)
    }

    const question = await this.prisma.question.create({
      data: {
        authorId: user.sub,
        title,
        slug,
        content: content,
      },
    })

    return {
      questionId: question.id,
      slug,
    }
  }

  private convertToSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
  }

  private convertToDuplicateSlug(title: string): string {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    return `${slug}-${new Date().getTime()}`
  }
}
