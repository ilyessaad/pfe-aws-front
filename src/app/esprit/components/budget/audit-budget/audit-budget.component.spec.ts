import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditBudgetComponent } from './audit-budget.component';

describe('AuditBudgetComponent', () => {
  let component: AuditBudgetComponent;
  let fixture: ComponentFixture<AuditBudgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditBudgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuditBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
