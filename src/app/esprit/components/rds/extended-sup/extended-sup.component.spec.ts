import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedSupComponent } from './extended-sup.component';

describe('ExtendedSupComponent', () => {
  let component: ExtendedSupComponent;
  let fixture: ComponentFixture<ExtendedSupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendedSupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtendedSupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
