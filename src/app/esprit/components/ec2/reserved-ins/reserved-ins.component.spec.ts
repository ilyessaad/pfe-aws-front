import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservedInsComponent } from './reserved-ins.component';

describe('ReservedInsComponent', () => {
  let component: ReservedInsComponent;
  let fixture: ComponentFixture<ReservedInsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservedInsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReservedInsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
