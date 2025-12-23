import { Injectable } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  create(createExamDto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        number: createExamDto.number,
      },
    });
  }

  findAll() {
    return this.prisma.exam.findMany();
  }

  findOne(id: number) {
    return this.prisma.exam.findUnique({
      where: { id },
    });
  }

  update(id: number, updateExamDto: UpdateExamDto) {
    return this.prisma.exam.update({
      where: { id },
      data: {
        number: updateExamDto.number,
      },
    });
  }

  remove(id: number) {
    return this.prisma.exam.delete({
      where: { id },
    });
  }
}
