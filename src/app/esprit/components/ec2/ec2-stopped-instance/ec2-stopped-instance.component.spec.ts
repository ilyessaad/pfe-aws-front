import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ec2StoppedInstanceComponent } from './ec2-stopped-instance.component';

describe('Ec2StoppedInstanceComponent', () => {
  let component: Ec2StoppedInstanceComponent;
  let fixture: ComponentFixture<Ec2StoppedInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ec2StoppedInstanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Ec2StoppedInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
