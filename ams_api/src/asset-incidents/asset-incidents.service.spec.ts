import { Test, TestingModule } from '@nestjs/testing';
import { AssetIncidentsService } from './asset-incidents.service';

describe('AssetIncidentsService', () => {
  let service: AssetIncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetIncidentsService],
    }).compile();

    service = module.get<AssetIncidentsService>(AssetIncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
