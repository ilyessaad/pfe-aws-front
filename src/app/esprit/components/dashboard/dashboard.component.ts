import { Component, OnInit } from '@angular/core';
import { UserService } from '../../service/user.service';
import { FinOpsService } from '../../service/finops.service';
import { MessageService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { HttpParams } from '@angular/common/http';
import { MultiSelectModule } from 'primeng/multiselect';
import { TabViewModule } from 'primeng/tabview';
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: [],
    providers: [MessageService],
    standalone: true,
    imports: [NgChartsModule, CommonModule, ToastModule, MultiSelectModule, TabViewModule, FormsModule]
})
export class DashboardComponent implements OnInit {
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

    // Graphiques
    barChartType: ChartType = 'bar';
    costTrendOptions: ChartOptions<'bar'> = {
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' } }, x: { title: { display: true, text: 'Service' } } },
        plugins: { legend: { display: false }, title: { display: true, text: '' } }
    };
    costTrendData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    budgetChartType: ChartType = 'bar';
    budgetChartOptions: ChartOptions<'bar'> = {
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Amount (USD)' } }, x: { title: { display: true, text: 'Budget' } } },
        plugins: { legend: { position: 'top' }, title: { display: true, text: '' } }
    };
    budgetChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    underUtilizedChartType: ChartType = 'line';
    underUtilizedChartOptions: ChartOptions<'line'> = {
        scales: { y: { beginAtZero: true, max: 10, title: { display: true, text: 'CPU Utilization (%)' } }, x: { title: { display: true, text: 'Instance ID' } } },
        plugins: { legend: { position: 'top' }, title: { display: true, text: '' } }
    };
    underUtilizedChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

    resourcesChartType: ChartType = 'pie';
    resourcesChartOptions: ChartOptions<'pie'> = {
        plugins: { legend: { position: 'right' }, title: { display: true, text: '' } }
    };
    resourcesChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

    constructor(
        private userService: UserService,
        private finOpsService: FinOpsService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadUsersAndInitialize();
    }

    loadUsersAndInitialize(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.availableUserIds = [
                    { label: 'All', value: 'all' },
                    ...users.map((user) => {
                        const arnParts = user.arn.split('/');
                        const userName = arnParts.length > 1 ? arnParts[1] : user.arn;
                        return { label: userName, value: user.access_key_id };
                    })
                ];
                if (users.length > 0) {
                    this.selectedUserIds = [users[0].access_key_id];
                }
                this.loadAvailableRegions();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
                this.loadAvailableRegions();
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
                this.loadFinOpsData();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load regions: ' + error.message
                });
                this.loadFinOpsData();
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

        if (this.finOpsData && this.finOpsData.global) {
            const data = this.finOpsData.global;

            this.costTrendOptions.plugins!.title!.text = `Top 5 Services by Cost (${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}) - ${regionsText} - ${usersText}`;
            this.budgetChartOptions.plugins!.title!.text = `Top 5 Budgets (Closest to Limit) - ${usersText}`;
            this.underUtilizedChartOptions.plugins!.title!.text = `Under-Utilized EC2 Instances (CPU < 10%) - ${regionsText} - ${usersText}`;
            this.resourcesChartOptions.plugins!.title!.text = `Resources by Service - ${usersText}`;

            this.costTrendData = {
                labels: data.cost_trend.map((trend: any) => trend.service),
                datasets: [{ label: 'Cost (USD)', data: data.cost_trend.map((trend: any) => trend.cost), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
            };

            this.budgetChartData = {
                labels: data.budget_data.map((budget: any) => budget.budget_name),
                datasets: [
                    { label: 'Budget Limit (USD)', data: data.budget_data.map((budget: any) => budget.budget_limit), backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                    { label: 'Actual Spend (USD)', data: data.budget_data.map((budget: any) => budget.actual_spend), backgroundColor: 'rgba(255, 99, 132, 0.6)' }
                ]
            };

            this.underUtilizedChartData = {
                labels: data.under_utilized_instances.map((instance: any) => instance.instance_id),
                datasets: [{ label: 'Average CPU Utilization (%)', data: data.under_utilized_instances.map((instance: any) => instance.avg_cpu), fill: false, borderColor: 'rgba(153, 102, 255, 0.6)', tension: 0.1 }]
            };

            this.resourcesChartData = {
                labels: data.resources_by_service.map((service: any) => service.service),
                datasets: [{
                    data: data.resources_by_service.map((service: any) => service.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                    borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0'],
                    borderWidth: 1
                }]
            };
        } else if (this.finOpsData && this.selectedUserIds.length > 0) {
            // Pour chaque utilisateur sélectionné, mettre à jour les données de graphique localement
            const userId = this.selectedUserIds[0]; // Pour simplifier, prenons le premier utilisateur sélectionné
            if (this.finOpsData[userId]) {
                const data = this.finOpsData[userId];
                const userName = this.availableUserIds.find(u => u.value === userId)?.label || userId;

                this.costTrendOptions.plugins!.title!.text = `Top 5 Services by Cost (${this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}) - ${userName} - ${regionsText}`;
                this.budgetChartOptions.plugins!.title!.text = `Top 5 Budgets (Closest to Limit) - ${userName}`;
                this.underUtilizedChartOptions.plugins!.title!.text = `Under-Utilized EC2 Instances (CPU < 10%) - ${userName} - ${regionsText}`;
                this.resourcesChartOptions.plugins!.title!.text = `Resources by Service - ${userName}`;

                this.costTrendData = {
                    labels: data.cost_trend.map((trend: any) => trend.service),
                    datasets: [{ label: 'Cost (USD)', data: data.cost_trend.map((trend: any) => trend.cost), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
                };

                this.budgetChartData = {
                    labels: data.budget_data.map((budget: any) => budget.budget_name),
                    datasets: [
                        { label: 'Budget Limit (USD)', data: data.budget_data.map((budget: any) => budget.budget_limit), backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                        { label: 'Actual Spend (USD)', data: data.budget_data.map((budget: any) => budget.actual_spend), backgroundColor: 'rgba(255, 99, 132, 0.6)' }
                    ]
                };

                this.underUtilizedChartData = {
                    labels: data.under_utilized_instances.map((instance: any) => instance.instance_id),
                    datasets: [{ label: 'Average CPU Utilization (%)', data: data.under_utilized_instances.map((instance: any) => instance.avg_cpu), fill: false, borderColor: 'rgba(153, 102, 255, 0.6)', tension: 0.1 }]
                };

                this.resourcesChartData = {
                    labels: data.resources_by_service.map((service: any) => service.service),
                    datasets: [{
                        data: data.resources_by_service.map((service: any) => service.count),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                        borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0'],
                        borderWidth: 1
                    }]
                };
            }
        }
    }

    onFilterChange(): void {
        this.loadFinOpsData();
    }
}
