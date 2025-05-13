import { Component, ElementRef, ViewChild } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { UserService } from '../esprit/service/user.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
    providers: [MessageService] ,

})
export class AppTopBarComponent {

    items!: MenuItem[];
    loggedIn$: Observable<boolean>; // Observable pour suivre l'état de connexion

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService, private authService: UserService,  private messageService: MessageService,
      private router:Router
    ) { }

    ngOnInit(): void {
      this.loggedIn$ = this.authService.isLoggedIn();
    }

    getUserId(): string | null {
        return localStorage.getItem('user_id');
      }

      logout(): void {
        this.authService.logout();

        Swal.fire({
          icon: 'success',
          title: 'Vous êtes déconnecté',
          showConfirmButton: false,
          timer: 1500
        });


        this.router.navigate(['/']);
      }


}
