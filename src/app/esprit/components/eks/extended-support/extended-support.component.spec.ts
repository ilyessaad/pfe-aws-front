import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedSupportComponent } from './extended-support.component';

describe('ExtendedSupportComponent', () => {
  let component: ExtendedSupportComponent;
  let fixture: ComponentFixture<ExtendedSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedSupportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtendedSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
