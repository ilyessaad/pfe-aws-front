import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ec2StoppedInstanceComponent } from './ec2-stopped-instance/ec2-stopped-instance.component';
import { Ec2RoutingModule } from './ec2-routing.module';
import {ReservedInsComponent} from "./reserved-ins/reserved-ins.component";
import {CheckGenComponent} from "./check-gen/check-gen.component";

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        Ec2RoutingModule,
        Ec2StoppedInstanceComponent,
        ReservedInsComponent,CheckGenComponent
    ]
})
export class Ec2Module {}
