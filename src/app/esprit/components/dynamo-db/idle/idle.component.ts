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
    selector: 'app-idle',
    templateUrl: './idle.component.html',
    styleUrls: ['./idle.component.scss'],
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
export class IdleComponent implements OnInit, AfterViewInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // MultiSelect for accounts
    accountsWithAnomalies: { label: string; value: string }[] = [];
    selectedAccounts: string[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Bar Chart for number of DynamoDB tables per account
    accountDynamoChartType: ChartType = 'bar';
    accountDynamoChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of DynamoDB Tables' },
                ticks: { stepSize: 1 } // Forcer un pas de 1 pour des valeurs entières
            },
            x: {
                title: { display: true, text: 'Account Name' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Number of DynamoDB Tables by Account' }
        }
    };
    accountDynamoChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

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

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('AWS DynamoDB Table Idle').subscribe({
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

        // Bar Chart for Number of DynamoDB Tables per Account
        const accountNames = [...new Set(filteredAnomalies.map(anomaly => anomaly.account_name || 'Unknown'))];
        const accountCounts = accountNames.map(accountName =>
            filteredAnomalies.filter(anomaly => (anomaly.account_name || 'Unknown') === accountName).length
        );

        this.accountDynamoChartData = {
            labels: accountNames,
            datasets: [{
                label: 'Number of DynamoDB Tables',
                data: accountCounts,
                backgroundColor: 'rgba(0, 0, 0, 0.6)' // Black
            }]
        };
        console.log('Account Dynamo chart data:', this.accountDynamoChartData);
    }

    onAccountSelectionChange(): void {
        console.log('Selected accounts after change:', this.selectedAccounts);
        this.updateCharts();
    }

    protected readonly JSON = JSON;
}
