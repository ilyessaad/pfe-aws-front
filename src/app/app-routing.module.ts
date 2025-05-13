import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotfoundComponent } from './esprit/components/notfound/notfound.component';
import { AppLayoutComponent } from './layout/app.layout.component';

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
                    { path: 'dashboard', loadChildren: () => import('./esprit/components/dashboard/dashboard.module').then(m => m.DashboardModule) }
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
export class AppRoutingModule { }
