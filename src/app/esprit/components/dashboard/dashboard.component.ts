import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { FinOpsService } from '../../service/finops.service';
import { AwsUser } from '../../models/aws-user';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { HttpParams } from '@angular/common/http';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: [],
    providers: [MessageService, ConfirmationService],
    standalone: true,
    imports: [NgChartsModule, CommonModule, ConfirmDialogModule, ToastModule, FormsModule, DialogModule, TableModule, MultiSelectModule]
})
export class DashboardComponent implements OnInit {
    users: AwsUser[] = [];
    displayAddUserDialog: boolean = false;
    newUser: { access_key_id: string; secret_access_key: string } = {
        access_key_id: '',
        secret_access_key: ''
    };
    currentDate = new Date();
    loading = false;
    errorMessage = '';
    finOpsData: any = {
        monthly_costs: [],
        forecast_cost: 0.0,
        cost_trend: [],
        under_utilized_instances: [],
        costs_by_service: [],
        budget_count: 0,
        budget_data: [],
        resources_by_service: [],
        all_data_by_region: {}
    };

    // Filtres pour les sélections multiples
    selectedRegions: string[] = [];
    selectedUserIds: string[] = [];
    availableRegions: { label: string, value: string }[] = [];
    availableUserIds: { label: string, value: string }[] = [];

    // Graphique de coût des services (Top 5 services du mois courant)
    barChartType: ChartType = 'bar';
    costTrendOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' } },
            x: { title: { display: true, text: 'Service' } }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: '' }
        }
    };
    costTrendData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Graphique Budget Utilization (Top 5 budgets)
    budgetChartType: ChartType = 'bar';
    budgetChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Amount (USD)' } },
            x: { title: { display: true, text: 'Budget' } }
        },
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: '' }
        }
    };
    budgetChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Graphique Under-Utilized Instances (Line Chart)
    underUtilizedChartType: ChartType = 'line';
    underUtilizedChartOptions: ChartOptions<'line'> = {
        scales: {
            y: { beginAtZero: true, max: 10, title: { display: true, text: 'CPU Utilization (%)' } },
            x: { title: { display: true, text: 'Instance ID' } }
        },
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: '' }
        }
    };
    underUtilizedChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

    // Graphique Resources by Service (Pie Chart)
    resourcesChartType: ChartType = 'pie';
    resourcesChartOptions: ChartOptions<'pie'> = {
        plugins: {
            legend: { position: 'right' },
            title: { display: true, text: '' }
        }
    };
    resourcesChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

    constructor(
        private userService: UserService,
        private finOpsService: FinOpsService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadFinOpsData();
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.availableUserIds = [
                    { label: 'All', value: 'all' },
                    ...users.map((user) => {
                        // Extract the user name from ARN (e.g., arn:aws:iam::123456789012:user/Ilyes_SAAD_stagiaire)
                        const arnParts = user.arn.split('/');
                        const userName = arnParts.length > 1 ? arnParts[1] : user.arn;
                        return { label: userName, value: user.access_key_id };
                    })
                ];
                this.loadAvailableRegions();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error', // Updated to English
                    detail: error.message
                });
            }
        });
    }

    loadAvailableRegions(): void {
        this.finOpsService.getServices().subscribe({
            next: (services) => {
                const regions = [...new Set(services.map((service: any) => service.region || 'Unknown'))].filter(region => region !== 'Unknown');
                this.availableRegions = [
                    { label: 'All', value: 'all' },
                    ...regions.map((region: string) => ({ label: region, value: region }))
                ];
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error', // Updated to English
                    detail: 'Failed to load regions: ' + error.message // Updated to English
                });
            }
        });
    }

    loadFinOpsData(): void {
        this.loading = true;
        let params = new HttpParams();

        if (this.selectedRegions && this.selectedRegions.length > 0 && !this.selectedRegions.includes('all')) {
            this.selectedRegions.forEach(region => {
                params = params.append('region', region);
            });
        }

        if (this.selectedUserIds && this.selectedUserIds.length > 0 && !this.selectedUserIds.includes('all')) {
            this.selectedUserIds.forEach(userId => {
                params = params.append('user_id', userId);
            });
        }

        this.finOpsService.getFinOpsOverview(params).subscribe({
            next: (response) => {
                if (response.status === 'success') {
                    this.finOpsData = response.data;
                    this.updateChartData();
                } else {
                    this.errorMessage = response.message;
                }
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.loading = false;
            }
        });
    }

    updateChartData(): void {
        const regionsText = this.selectedRegions && this.selectedRegions.length > 0 && !this.selectedRegions.includes('all')
            ? this.selectedRegions.join(', ')
            : 'All Regions';
        const usersText = this.selectedUserIds && this.selectedUserIds.length > 0 && !this.selectedUserIds.includes('all')
            ? this.selectedUserIds.join(', ')
            : 'All Users';

        this.costTrendOptions.plugins!.title!.text = `Top 5 Services by Cost (${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}) - ${regionsText} - ${usersText}`;
        this.budgetChartOptions.plugins!.title!.text = `Top 5 Budgets (Closest to Limit) - ${usersText}`;
        this.underUtilizedChartOptions.plugins!.title!.text = `Under-Utilized EC2 Instances (CPU < 10%) - ${regionsText} - ${usersText}`;
        this.resourcesChartOptions.plugins!.title!.text = `Resources by Service - ${usersText}`;

        this.costTrendData = {
            labels: this.finOpsData.cost_trend.map((trend: any) => trend.service),
            datasets: [
                {
                    label: 'Cost (USD)',
                    data: this.finOpsData.cost_trend.map((trend: any) => trend.cost),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                }
            ]
        };

        this.budgetChartData = {
            labels: this.finOpsData.budget_data.map((budget: any) => budget.budget_name),
            datasets: [
                {
                    label: 'Budget Limit (USD)',
                    data: this.finOpsData.budget_data.map((budget: any) => budget.budget_limit),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Actual Spend (USD)',
                    data: this.finOpsData.budget_data.map((budget: any) => budget.actual_spend),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                }
            ]
        };

        this.underUtilizedChartData = {
            labels: this.finOpsData.under_utilized_instances.map((instance: any) => instance.instance_id),
            datasets: [
                {
                    label: 'Average CPU Utilization (%)',
                    data: this.finOpsData.under_utilized_instances.map((instance: any) => instance.avg_cpu),
                    fill: false,
                    borderColor: 'rgba(153, 102, 255, 0.6)',
                    tension: 0.1
                }
            ]
        };

        this.resourcesChartData = {
            labels: this.finOpsData.resources_by_service.map((service: any) => service.service),
            datasets: [
                {
                    data: this.finOpsData.resources_by_service.map((service: any) => service.count),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#C9CBCF'
                    ],
                    borderColor: [
                        '#FF4066',
                        '#1E7ACF',
                        '#E6B800',
                        '#3DA8A8',
                        '#7D4DE0',
                        '#FF751A',
                        '#A6A9B0'
                    ],
                    borderWidth: 1
                }
            ]
        };
    }

    onFilterChange(): void {
        this.loadFinOpsData();
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
                    summary: 'Success', // Updated to English
                    detail: response.message
                });
                this.displayAddUserDialog = false;
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error', // Updated to English
                    detail: error.message
                });
            }
        });
    }

    confirmDeleteUser(userId: number): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this user?', // Updated to English
            header: 'Delete Confirmation', // Updated to English
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes', // Updated to English
            rejectLabel: 'No', // Updated to English
            accept: () => {
                this.deleteUser(userId);
            }
        });
    }

    deleteUser(userId: number): void {
        this.userService.deleteUser(userId).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success', // Updated to English
                    detail: response.message
                });
                this.loadUsers();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error', // Updated to English
                    detail: error.message
                });
            }
        });
    }
}
