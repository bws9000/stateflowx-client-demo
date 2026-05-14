import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {

  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {

    expect(component).toBeTruthy();
  });

  it('should update response after submit', fakeAsync(() => {

    component.prompt.set('Hello Gemini');

    component.submit();

    expect(component.loading()).toBe(true);

    tick(500);

    expect(component.loading()).toBe(false);

    expect(component.response()).toContain('Hello Gemini');
  }));
});
