import { Test, TestingModule } from '@nestjs/testing';
import { AssetAssignmentsService } from './assets-assignments.service';

describe('AssetAssignmentsService', () => {
  let service: AssetAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AssetAssignmentsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AssetAssignmentsService>(AssetAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
