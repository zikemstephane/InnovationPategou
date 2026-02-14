import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsSettingsPage } from './notifications-settings.page';

describe('NotificationsSettingsPage', () => {
  let component: NotificationsSettingsPage;
  let fixture: ComponentFixture<NotificationsSettingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
