import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EksRoutingModule } from './eks-routing.module';
import {ExtendedSupComponent} from "./extended-support/extended-sup.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EksRoutingModule,
      ExtendedSupComponent
  ]
})
export class EksModule { }
