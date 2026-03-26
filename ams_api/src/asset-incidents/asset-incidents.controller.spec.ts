import { Test, TestingModule } from '@nestjs/testing';
import { AssetIncidentsController } from './asset-incidents.controller';
import { AssetIncidentsService } from './asset-incidents.service';

describe('AssetIncidentsController', () => {
  let controller: AssetIncidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetIncidentsController],
      providers: [AssetIncidentsService],
    }).compile();

    controller = module.get<AssetIncidentsController>(AssetIncidentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
