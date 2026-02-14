import { TestBed } from '@angular/core/testing';

import { RideService } from './ride';

describe('Ride', () => {
  let service: RideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
