import { Test, TestingModule } from '@nestjs/testing';
import { AssetRequestsService } from './assets-requests.service';

describe('AssetRequestsService', () => {
  let service: AssetRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AssetRequestsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AssetRequestsService>(AssetRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
