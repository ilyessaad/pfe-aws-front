import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupRoutingModule } from './signup-routing.module';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { SignupComponent } from './signup.component';
import { SplitterModule } from 'primeng/splitter';

@NgModule({
    imports: [
        CommonModule,
        SignupRoutingModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        FormsModule,
        PasswordModule,
        ReactiveFormsModule,
        SplitterModule
    ],
    declarations: [SignupComponent]
})
export class SignupModule { }
