import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignupPartnerComponent } from './signup-partner.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: SignupPartnerComponent }
])],
  exports: [RouterModule]
})
export class SignupPartnerRoutingModule { }
