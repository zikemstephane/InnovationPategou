import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RidesPage } from './rides.page';

describe('RidesPage', () => {
  let component: RidesPage;
  let fixture: ComponentFixture<RidesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RidesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
