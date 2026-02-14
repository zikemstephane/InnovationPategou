import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TwoFAPage } from './two-fa.page';

describe('TwoFAPage', () => {
  let component: TwoFAPage;
  let fixture: ComponentFixture<TwoFAPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoFAPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
