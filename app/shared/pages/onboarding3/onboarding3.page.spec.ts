import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Onboarding3Page } from './onboarding3.page';

describe('Onboarding3Page', () => {
  let component: Onboarding3Page;
  let fixture: ComponentFixture<Onboarding3Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Onboarding3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
