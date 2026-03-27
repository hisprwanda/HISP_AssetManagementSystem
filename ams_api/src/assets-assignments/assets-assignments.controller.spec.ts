import { Test, TestingModule } from '@nestjs/testing';
import { AssetAssignmentsController } from './assets-assignments.controller';
import { AssetAssignmentsService } from './assets-assignments.service';

describe('AssetAssignmentsController', () => {
  let controller: AssetAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetAssignmentsController],
      providers: [
        {
          provide: AssetAssignmentsService,
          useValue: {}, // Mock service to avoid DI issues in basic test
        },
      ],
    }).compile();

    controller = module.get<AssetAssignmentsController>(
      AssetAssignmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
