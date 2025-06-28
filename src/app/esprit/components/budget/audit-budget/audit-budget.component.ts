import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AnomalyService, Anomaly, AnomalyResponse } from '../../../service/anomaly.service';
import { MessageService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { AnomalyErrorResponse, AnomalySuccessResponse } from "../../../service/anomaly.service";

@Component({
    selector: 'app-audit-budget',
    templateUrl: './audit-budget.component.html',
    styleUrls: ['./audit-budget.component.scss'],
    providers: [MessageService],
    standalone: true,
    imports: [
        NgChartsModule,
        CommonModule,
        ToastModule,
        TableModule,
        MultiSelectModule,
        FormsModule
    ]
})
export class AuditBudgetComponent implements OnInit, AfterViewInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // MultiSelect for accounts
    accountsWithAnomalies: { label: string; value: string }[] = [];
    selectedAccounts: string[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Chart configurations
    budgetChartType: ChartType = 'bar';
    budgetChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 10
                },
                title: { display: true, text: 'Amount ($)' }
            },
            x: {
                title: { display: true, text: 'Budget Name' }
            }
        },
        plugins: {
            legend: { display: true },
            title: { display: true, text: 'Budget Details with Forecast' }
        }
    };
    budgetChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Additional chart for number of budgets per account
    accountChartType: ChartType = 'bar';
    accountChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Budgets' },
                ticks: { stepSize: 1 }
            },
            x: {
                title: { display: true, text: 'Account Name' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Number of Budgets by Account' }
        }
    };
    accountChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    constructor(
        private anomalyService: AnomalyService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadAnomalies();
    }

    ngAfterViewInit(): void {
        if (this.accountsWithAnomalies.length > 0 && this.selectedAccounts.length === 0) {
            this.selectedAccounts = [this.accountsWithAnomalies[0].value];
            console.log('Default selectedAccounts in ngAfterViewInit:', this.selectedAccounts);
            this.cdr.detectChanges();
            this.updateCharts();
        } else {
            console.log('ngAfterViewInit: accountsWithAnomalies is empty or selectedAccounts already set', {
                accountsWithAnomalies: this.accountsWithAnomalies,
                selectedAccounts: this.selectedAccounts
            });
        }
    }

    get numberOfBudgetsByResource(): { [key: string]: number } {
        const filteredAnomalies = this.getFilteredAnomalies();
        const budgetCountByResource: { [key: string]: number } = {};
        filteredAnomalies.forEach(anomaly => {
            console.log('Anomaly details:', anomaly.details);
            const resourceId = anomaly.details?.resource_id || 'Unknown';
            budgetCountByResource[resourceId] = (budgetCountByResource[resourceId] || 0) + 1;
        });
        console.log('numberOfBudgetsByResource:', budgetCountByResource);
        return budgetCountByResource;
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('AWS Audit Budget Notifications').subscribe({
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
                    console.log('Raw anomalies data:', this.anomalies);
                    if (this.anomalies.length === 0) {
                        console.log('No anomalies data received from API');
                    }
                    this.updateAccountList();
                    if (this.accountsWithAnomalies.length > 0 && this.selectedAccounts.length === 0) {
                        this.selectedAccounts = [this.accountsWithAnomalies[0].value];
                        console.log('Default selectedAccounts in loadAnomalies:', this.selectedAccounts);
                        this.cdr.detectChanges();
                        this.updateCharts();
                    }
                } else {
                    const errorResponse = response as AnomalyErrorResponse;
                    this.errorMessage = errorResponse.message;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorResponse.message
                    });
                }
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load anomalies: ' + error.message
                });
                this.loading = false;
            }
        });
    }

    updateAccountList(): void {
        const uniqueAccounts = [...new Set(this.anomalies.map(anomaly => anomaly.account_name || 'Unknown'))];
        this.accountsWithAnomalies = uniqueAccounts.map(account => ({ label: account, value: account }));
        console.log('accountsWithAnomalies:', this.accountsWithAnomalies);
    }

    getFilteredAnomalies(): Anomaly[] {
        const filtered = this.selectedAccounts.length > 0
            ? this.anomalies.filter(anomaly => this.selectedAccounts.includes(anomaly.account_name || 'Unknown'))
            : [];
        this.totalRecords = filtered.length;
        console.log('Filtered anomalies:', filtered);
        return filtered;
    }

    updateCharts(): void {
        const filteredAnomalies = this.getFilteredAnomalies();

        // Budget Details Chart (Bar)
        const budgetNames = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.budget_name))].filter(name => name);
        const actualSpendData = budgetNames.map(name => {
            const anomaly = filteredAnomalies.find(a => a.details?.budget_name === name);
            return anomaly?.details?.calculated_spend?.actual_spend || 0;
        });
        const budgetLimitData = budgetNames.map(name => {
            const anomaly = filteredAnomalies.find(a => a.details?.budget_name === name);
            return anomaly?.details?.budget_limit || 0;
        });
        const forecastSpendData = budgetNames.map(name => {
            const anomaly = filteredAnomalies.find(a => a.details?.budget_name === name);
            return anomaly?.details?.calculated_spend?.forecasted_spend || 0;
        });

        this.budgetChartData = {
            labels: budgetNames,
            datasets: [
                { type: 'bar', label: 'Actual Spend', data: actualSpendData, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                { type: 'bar', label: 'Budget Limit', data: budgetLimitData, backgroundColor: 'rgba(255, 99, 132, 0.6)' },
                { type: 'bar', label: 'Forecast Spend', data: forecastSpendData, backgroundColor: 'rgba(75, 192, 192, 0.6)' }
            ]
        };
        console.log('Chart data:', this.budgetChartData);

        // Bar Chart for Number of Budgets per Account
        if (this.selectedAccounts.length >= 2) {
            const accountNames = [...new Set(filteredAnomalies.map(anomaly => anomaly.account_name || 'Unknown'))];
            const accountCounts = accountNames.map(accountName =>
                filteredAnomalies.filter(anomaly => (anomaly.account_name || 'Unknown') === accountName).length
            );

            this.accountChartData = {
                labels: accountNames,
                datasets: [{
                    label: 'Number of Budgets',
                    data: accountCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            };
        } else {
            this.accountChartData = { labels: [], datasets: [] };
        }
    }

    onAccountSelectionChange(): void {
        console.log('Selected accounts after change:', this.selectedAccounts);
        this.updateCharts();
    }

    // Utility to get object keys for template
    objectKeys(obj: object): string[] {
        return Object.keys(obj);
    }

    protected readonly JSON = JSON;
}
