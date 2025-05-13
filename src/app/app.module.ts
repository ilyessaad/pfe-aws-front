import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppLayoutModule } from './layout/app.layout.module';

import { AppLayoutComponent } from './layout/app.layout.component';
import { AppTopBarComponent } from './layout/app.topbar.component';
import { AppSidebarComponent } from './layout/app.sidebar.component';
import { AppMenuComponent } from './layout/app.menu.component';
import { AppFooterComponent } from './layout/app.footer.component';
import { LoginComponent } from './esprit/components/auth/login/login.component';
import { DashboardComponent } from './esprit/components/dashboard/dashboard.component';
import {AppConfigModule} from "./layout/config/config.module";

@NgModule({
    declarations: [
        AppComponent,



    ],
    imports: [
        BrowserModule,
        CommonModule,
        HttpClientModule,
        FormsModule,
        BrowserAnimationsModule,
        MessagesModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        AppRoutingModule,
        AppLayoutModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
