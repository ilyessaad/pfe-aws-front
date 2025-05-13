import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgetPassComponent } from './forget-pass.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: ForgetPassComponent }
])],
  exports: [RouterModule]
})
export class ForgetPassRoutingModule { }
