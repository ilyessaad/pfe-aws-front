import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignupPartnerRoutingModule } from './signup-partner-routing.module';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { SignupPartnerComponent } from './signup-partner.component';


@NgModule({
  imports: [
    CommonModule,
    SignupPartnerRoutingModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    FormsModule,
    PasswordModule,
    ReactiveFormsModule
],
declarations: [SignupPartnerComponent]
})
export class SignupPartnerModule { }
