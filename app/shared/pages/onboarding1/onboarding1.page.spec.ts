import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Onboarding1Page } from './onboarding1.page';

describe('Onboarding1Page', () => {
  let component: Onboarding1Page;
  let fixture: ComponentFixture<Onboarding1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Onboarding1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
