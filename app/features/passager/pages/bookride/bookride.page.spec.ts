import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookridePage } from './bookride.page';

describe('BookridePage', () => {
  let component: BookridePage;
  let fixture: ComponentFixture<BookridePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookridePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
