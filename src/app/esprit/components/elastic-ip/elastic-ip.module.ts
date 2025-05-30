import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ElasticIPRoutingModule } from './elastic-ip-routing.module';
import {AttachedComponent} from "./attached/attached.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ElasticIPRoutingModule,
      AttachedComponent
  ]
})
export class ElasticIPModule { }
