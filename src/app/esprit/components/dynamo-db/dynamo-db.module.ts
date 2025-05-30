import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DynamoDBRoutingModule } from './dynamo-db-routing.module';
import {IdleComponent} from "./idle/idle.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DynamoDBRoutingModule,
    IdleComponent
  ]
})
export class DynamoDBModule { }
