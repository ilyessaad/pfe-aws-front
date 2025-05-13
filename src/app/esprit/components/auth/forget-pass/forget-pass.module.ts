import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgetPassRoutingModule } from './forget-pass-routing.module';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { ForgetPassComponent } from './forget-pass.component';

@NgModule({
    imports: [
        CommonModule,
        ForgetPassRoutingModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        FormsModule,
        PasswordModule
    ],
    declarations: [ForgetPassComponent]
})
export class ForgetPassModule { }
