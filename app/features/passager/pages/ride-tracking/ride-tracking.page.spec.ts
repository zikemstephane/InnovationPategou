import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RideTrackingPage } from './ride-tracking.page';

describe('RideTrackingPage', () => {
  let component: RideTrackingPage;
  let fixture: ComponentFixture<RideTrackingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RideTrackingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
