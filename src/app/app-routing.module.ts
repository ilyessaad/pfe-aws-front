import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotfoundComponent } from './esprit/components/notfound/notfound.component';
import { AppLayoutComponent } from './layout/app.layout.component';
import { Ec2StoppedInstanceComponent } from './esprit/components/ec2/ec2-stopped-instance/ec2-stopped-instance.component';
import {AuditBudgetComponent} from "./esprit/components/budget/audit-budget/audit-budget.component";
import {ReservedInsComponent} from "./esprit/components/ec2/reserved-ins/reserved-ins.component";
import {CheckGenComponent} from "./esprit/components/ec2/check-gen/check-gen.component";
import {IdleComponent} from "./esprit/components/dynamo-db/idle/idle.component";
import {AttachedComponent} from "./esprit/components/elastic-ip/attached/attached.component";
import {ExtendedSupComponent} from "./esprit/components/rds/extended-sup/extended-sup.component";
import {ExtendedSupportComponent} from "./esprit/components/eks/extended-support/extended-support.component";
import {ReplicasComponent} from "./esprit/components/rds/replicas/replicas.component";
import {StoppedComponent} from "./esprit/components/rds/stopped/stopped.component";


@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: '',
                loadChildren: () => import('./esprit/components/auth/login/login.module').then(m => m.LoginModule)
            },
            {
                path: 'login',
                loadChildren: () => import('./esprit/components/auth/login/login.module').then(m => m.LoginModule)
            },
            {
                path: 'notfound',
                component: NotfoundComponent
            },
            {
                path: '',
                component: AppLayoutComponent,
                children: [
                    { path: 'dashboard', loadChildren: () => import('./esprit/components/dashboard/dashboard.module').then(m => m.DashboardModule) },
                    { path: 'ec2/stopped_instance', component: Ec2StoppedInstanceComponent },
                    { path: 'budget/audit', component: AuditBudgetComponent },
                    { path: 'ec2/reserved_ins', component: ReservedInsComponent },
                    { path: 'ec2/check_gen', component: CheckGenComponent },
                    { path: 'dynamoDB/idle', component: IdleComponent },
                    { path: 'eks/extended_supp', component: ExtendedSupportComponent },
                    { path: 'elasticIp/attached', component: AttachedComponent },
                    { path: 'rds/extended_supp', component:ExtendedSupComponent },
                    { path: 'rds/replicas', component: ReplicasComponent },
                    { path: 'rds/stopped', component: StoppedComponent },




                ]
            },
            { path: '**', redirectTo: 'notfound' }
        ], {
            scrollPositionRestoration: 'enabled',
            anchorScrolling: 'enabled',
            onSameUrlNavigation: 'reload'
        })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}
