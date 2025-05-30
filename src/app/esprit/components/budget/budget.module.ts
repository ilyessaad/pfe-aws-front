import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BudgetRoutingModule } from './budget-routing.module';
import {AuditBudgetComponent} from "./audit-budget/audit-budget.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BudgetRoutingModule,
      AuditBudgetComponent
  ]
})
export class BudgetModule { }
