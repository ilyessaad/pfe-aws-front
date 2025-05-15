import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { AwsUser } from '../../models/aws-user';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: [],
    providers: [MessageService, ConfirmationService]
})
export class DashboardComponent implements OnInit {
    users: AwsUser[] = [];
    displayAddUserDialog: boolean = false;
    newUser: { access_key_id: string; secret_access_key: string } = {
        access_key_id: '',
        secret_access_key: ''
    };

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.message
                });
            }
        });
    }

    showAddUserDialog(): void {
        this.newUser = { access_key_id: '', secret_access_key: '' };
        this.displayAddUserDialog = true;
    }

    addUser(): void {
        this.userService.addUser(this.newUser).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: response.message
                });
                this.displayAddUserDialog = false;
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.message
                });
            }
        });
    }

    confirmDeleteUser(userId: number): void {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.deleteUser(userId);
            },
            reject: () => {
                // Ne rien faire
            }
        });
    }

    deleteUser(userId: number): void {
        this.userService.deleteUser(userId).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: response.message
                });
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.message
                });
            }
        });
    }
}
