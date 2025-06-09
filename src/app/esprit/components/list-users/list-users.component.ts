import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../service/user.service';
import { AwsUser } from '../../models/aws-user';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-list-users',
    templateUrl: './list-users.component.html',
    providers: [MessageService, ConfirmationService],
    standalone: true,
    imports: [CommonModule, ConfirmDialogModule, ToastModule, FormsModule, DialogModule, TableModule, ButtonModule, InputTextModule]
})
export class ListUsersComponent implements OnInit {
    users: AwsUser[] = [];
    displayAddUserDialog: boolean = false;
    displayUpdateUserDialog: boolean = false;
    newUser: { access_key_id: string; secret_access_key: string; account_name: string } = {
        access_key_id: '',
        secret_access_key: '',
        account_name: ''
    };
    selectedUser: { account_id: string; access_key_id: string; secret_access_key: string; account_name: string } = {
        account_id: '',
        access_key_id: '',
        secret_access_key: '',
        account_name: ''
    };
    initialAccountName: string = '';
    initialAccessKeyId: string = '';
    initialSecretAccessKey: string = '';
    isEditingName: boolean = false;
    isEditingKeys: boolean = false;
    isAdmin: boolean = false;
    @Output() usersChanged = new EventEmitter<void>();

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadUsers();

        // Direct value access:
        const role = this.userService.getRole();
        this.isAdmin = role === 'admin';
        console.log('Role:', role);
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.usersChanged.emit();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
                this.usersChanged.emit();
            }
        });
    }

    showAddUserDialog(): void {
        this.newUser = { access_key_id: '', secret_access_key: '', account_name: '' };
        this.displayAddUserDialog = true;
    }

    addUser(): void {
        console.log('Attempting to add user:', this.newUser);
        this.userService.addUser(this.newUser).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.message
                });
                this.displayAddUserDialog = false;
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
            }
        });
    }

    showUpdateUserDialog(user: AwsUser): void {
        this.selectedUser = {
            account_id: user.account_id,
            access_key_id: user.access_key_id,
            secret_access_key: '',
            account_name: user.account_name
        };
        this.initialAccountName = user.account_name;
        this.initialAccessKeyId = user.access_key_id;
        this.initialSecretAccessKey = '';
        this.isEditingName = false;
        this.isEditingKeys = false;
        this.displayUpdateUserDialog = true;
    }

    updateUser(): void {
        const updateData: { access_key_id?: string; secret_access_key?: string; account_name?: string } = {};
        if (this.isEditingKeys && this.selectedUser.access_key_id && this.selectedUser.secret_access_key) {
            updateData.access_key_id = this.selectedUser.access_key_id;
            updateData.secret_access_key = this.selectedUser.secret_access_key;
        }
        if (this.isEditingName && this.selectedUser.account_name) {
            updateData.account_name = this.selectedUser.account_name;
        }
        if (Object.keys(updateData).length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'No changes to update'
            });
            return;
        }
        console.log('Sending update data:', updateData);
        this.userService.updateAccount(this.selectedUser.account_id, updateData).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.message
                });
                this.displayUpdateUserDialog = false;
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
            }
        });
    }

    toggleEditingName(): void {
        this.isEditingName = true;
        this.isEditingKeys = false;
    }

    toggleEditingKeys(): void {
        const accessKeyChanged = this.selectedUser.access_key_id !== this.initialAccessKeyId;
        const secretKeyChanged = this.selectedUser.secret_access_key !== '';
        this.isEditingKeys = accessKeyChanged || secretKeyChanged;
        this.isEditingName = !this.isEditingKeys;
    }

    hasChanges(): boolean {
        const nameChanged = this.isEditingName && this.selectedUser.account_name !== this.initialAccountName;
        const accessKeyChanged = this.isEditingKeys && this.selectedUser.access_key_id !== this.initialAccessKeyId;
        const secretKeyChanged = this.isEditingKeys && this.selectedUser.secret_access_key !== '';
        return nameChanged || accessKeyChanged || secretKeyChanged;
    }

    resetEditingModes(): void {
        const nameChanged = this.selectedUser.account_name !== this.initialAccountName;
        const accessKeyChanged = this.selectedUser.access_key_id !== this.initialAccessKeyId;
        const secretKeyChanged = this.selectedUser.secret_access_key !== '';
        if (!nameChanged && !accessKeyChanged && !secretKeyChanged) {
            this.isEditingName = false;
            this.isEditingKeys = false;
        }
    }

    confirmDeleteUser(accountId: string): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this account?',
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',
            accept: () => {
                this.deleteUser(accountId);
            }
        });
    }

    deleteUser(accountId: string): void {
        console.log('Attempting to delete user:', accountId);
        this.userService.deleteUser(accountId).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: response.message
                });
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
                console.log('Delete error details:', error); // Debug
            }
        });
    }
}
