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
    selector: 'app-stopped',
    templateUrl: './stopped.component.html',
    styleUrls: ['./stopped.component.scss'],
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
export class StoppedComponent implements OnInit, AfterViewInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // MultiSelect for accounts
    accountsWithAnomalies: { label: string; value: string }[] = [];
    selectedAccounts: string[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Bar Chart for db_instance_identifier and allocated_storage
    storageChartType: ChartType = 'bar';
    storageChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 800,
                ticks: {
                    stepSize: 100
                },
                title: { display: true, text: 'Allocated Storage (GB)' }
            },
            x: {
                title: { display: true, text: 'DB Instance Identifier' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Allocated Storage by DB Instance' }
        }
    };
    storageChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Bar Chart for number of instances per account
    accountInstanceChartType: ChartType = 'bar';
    accountInstanceChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 6,
                ticks: {
                    stepSize: 1
                },
                title: { display: true, text: 'Number of Instances' }
            },
            x: {
                title: { display: true, text: 'Account Name' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Number of Stopped Instances by Account' }
        }
    };
    accountInstanceChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

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
        this.anomalyService.getAnomalies('AWS RDS Instances Stopped').subscribe({
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

        // Bar Chart for db_instance_identifier and allocated_storage
        const dbInstanceIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.db_instance_identifier))].filter(id => id);
        const allocatedStorageData = dbInstanceIds.map(id => {
            const anomaly = filteredAnomalies.find(a => a.details?.db_instance_identifier === id);
            return anomaly?.details?.allocated_storage || 0;
        });

        this.storageChartData = {
            labels: dbInstanceIds,
            datasets: [{
                label: 'Allocated Storage',
                data: allocatedStorageData,
                backgroundColor: 'rgba(255, 215, 0, 0.6)' // Yellow
            }]
        };
        console.log('Storage chart data:', this.storageChartData);

        // Bar Chart for Number of Instances per Account
        const accountNames = [...new Set(filteredAnomalies.map(anomaly => anomaly.account_name || 'Unknown'))];
        const accountCounts = accountNames.map(accountName =>
            filteredAnomalies.filter(anomaly => (anomaly.account_name || 'Unknown') === accountName).length
        );

        this.accountInstanceChartData = {
            labels: accountNames,
            datasets: [{
                label: 'Number of Instances',
                data: accountCounts,
                backgroundColor: 'rgba(0, 0, 0, 0.6)' // Black
            }]
        };
        console.log('Account instance chart data:', this.accountInstanceChartData);
    }

    onAccountSelectionChange(): void {
        console.log('Selected accounts after change:', this.selectedAccounts);
        this.updateCharts();
    }

    protected readonly JSON = JSON;
}
