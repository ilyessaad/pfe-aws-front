import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicasComponent } from './replicas.component';

describe('ReplicasComponent', () => {
  let component: ReplicasComponent;
  let fixture: ComponentFixture<ReplicasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplicasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReplicasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
