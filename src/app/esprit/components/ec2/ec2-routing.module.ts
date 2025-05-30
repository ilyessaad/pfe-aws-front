import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Ec2StoppedInstanceComponent } from './ec2-stopped-instance/ec2-stopped-instance.component';

const routes: Routes = [
    { path: 'stopped_instance', component: Ec2StoppedInstanceComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class Ec2RoutingModule {}
