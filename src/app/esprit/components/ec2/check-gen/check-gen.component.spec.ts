import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckGenComponent } from './check-gen.component';

describe('CheckGenComponent', () => {
  let component: CheckGenComponent;
  let fixture: ComponentFixture<CheckGenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckGenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckGenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
