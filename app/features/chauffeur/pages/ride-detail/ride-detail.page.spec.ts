import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RideDetailPage } from './ride-detail.page';

describe('RideDetailPage', () => {
  let component: RideDetailPage;
  let fixture: ComponentFixture<RideDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RideDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
