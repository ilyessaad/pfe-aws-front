import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/esprit/service/user.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
    :host ::ng-deep .pi-eye,
    :host ::ng-deep .pi-eye-slash {
      transform:scale(1.6);
      margin-right: 1rem;
      color: var(--primary-color) !important;
    }
  `],
    providers: [MessageService]
})
export class LoginComponent implements OnInit {
    valCheck: string[] = ['remember'];
    form!: FormGroup;

    constructor(
        public layoutService: LayoutService,
        private formBuilder: FormBuilder,
        private service: UserService,
        private router: Router,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        window.addEventListener('storage', this.syncLocalStorage.bind(this));
    }

    ngOnDestroy(): void {
        window.removeEventListener('storage', this.syncLocalStorage.bind(this));
    }

    signin() {
        if (this.form.valid) {
            const credentials = {
                username: this.form.value.username,
                password: this.form.value.password
            };

            this.service.signIn(credentials).subscribe(
                (response) => {
                    if (response.status === 'success') {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Connexion réussie' });
                        setTimeout(() => {
                            this.router.navigate(['/dashboard']);
                        }, 1000);
                    }
                },
                (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error.message });
                }
            );
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs' });
        }
    }

    private syncLocalStorage(event: StorageEvent): void {
        if (event.key === 'loggedIn') {
            this.service.setLoggedIn(JSON.parse(event.newValue!));
        }
    }
}
