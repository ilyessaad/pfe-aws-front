import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoppedComponent } from './stopped.component';

describe('StoppedComponent', () => {
  let component: StoppedComponent;
  let fixture: ComponentFixture<StoppedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoppedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StoppedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
