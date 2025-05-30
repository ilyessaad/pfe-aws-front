import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RdsRoutingModule } from './rds-routing.module';
import {StoppedComponent} from "./stopped/stopped.component";
import {ReplicasComponent} from "./replicas/replicas.component";
import {ExtendedSupComponent} from "./extended-sup/extended-sup.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RdsRoutingModule,
      StoppedComponent,
      ReplicasComponent,
      ExtendedSupComponent
  ]
})
export class RdsModule { }
