import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

type PrismaServiceMock = {
  exam: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const createPrismaMock = (): PrismaServiceMock => ({
  exam: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('ExamService', () => {
  let service: ExamService;
  let prisma: PrismaServiceMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: PrismaService,
          useValue: prisma as unknown as PrismaService,
        },
      ],
    }).compile();

    service = module.get<ExamService>(ExamService);
  });

  it('서비스 인스턴스를 생성한다', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('Prisma exam.create를 호출하고 결과를 반환한다', async () => {
      const dto: CreateExamDto = { number: 10 };
      const created = { id: 1, number: 10 };
      prisma.exam.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prisma.exam.create).toHaveBeenCalledWith({
        data: { number: dto.number },
      });
      expect(result).toBe(created);
    });
  });

  describe('findAll', () => {
    it('Prisma exam.findMany를 호출한다', async () => {
      const exams = [
        { id: 1, number: 5 },
        { id: 2, number: 6 },
      ];
      prisma.exam.findMany.mockResolvedValue(exams);

      const result = await service.findAll();

      expect(prisma.exam.findMany).toHaveBeenCalledTimes(1);
      expect(result).toBe(exams);
    });
  });

  describe('findOne', () => {
    it('id를 이용해 exam.findUnique를 호출한다', async () => {
      const exam = { id: 3, number: 7 };
      prisma.exam.findUnique.mockResolvedValue(exam);

      const result = await service.findOne(3);

      expect(prisma.exam.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(result).toBe(exam);
    });
  });

  describe('update', () => {
    it('id와 dto를 이용해 exam.update를 호출한다', async () => {
      const dto: UpdateExamDto = { number: 42 };
      const updated = { id: 4, number: 42 };
      prisma.exam.update.mockResolvedValue(updated);

      const result = await service.update(4, dto);

      expect(prisma.exam.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { number: dto.number },
      });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('id를 이용해 exam.delete를 호출한다', async () => {
      const deleted = { id: 5, number: 11 };
      prisma.exam.delete.mockResolvedValue(deleted);

      const result = await service.remove(5);

      expect(prisma.exam.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(result).toBe(deleted);
    });
  });
});
