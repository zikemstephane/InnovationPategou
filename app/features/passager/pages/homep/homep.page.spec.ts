import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomepPage } from './homep.page';

describe('HomepPage', () => {
  let component: HomepPage;
  let fixture: ComponentFixture<HomepPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomepPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
