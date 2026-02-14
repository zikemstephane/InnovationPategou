import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RateRidePage } from './rate-ride.page';

describe('RateRidePage', () => {
  let component: RateRidePage;
  let fixture: ComponentFixture<RateRidePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RateRidePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
