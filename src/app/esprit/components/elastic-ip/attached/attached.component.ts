import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AnomalyService, Anomaly, AnomalyResponse } from '../../../service/anomaly.service';
import { MessageService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { FormsModule } from '@angular/forms';
import { AnomalyErrorResponse, AnomalySuccessResponse } from "../../../service/anomaly.service";

@Component({
    selector: 'app-attached',
    templateUrl: './attached.component.html',
    styleUrls: ['./attached.component.scss'],
    providers: [MessageService],
    standalone: true,
    imports: [
        NgChartsModule,
        CommonModule,
        ToastModule,
        TableModule,
        MultiSelectModule,
        PaginatorModule,
        FormsModule
    ]
})
export class AttachedComponent implements OnInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // Dropdown filter for accounts
    accountsWithAnomalies: { label: string; value: string }[] = [];
    selectedAccounts: string[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Configuration du graphique pour Elastic IPs par compte (Bar Chart)
    accountChartType: ChartType = 'bar';
    accountChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Elastic IPs' },
                ticks: { stepSize: 1 } // Forcer un pas de 1 pour des valeurs entières
            },
            x: {
                title: { display: true, text: 'Account Name' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Elastic IPs by Account' }
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

    get numberOfElasticIps(): number {
        return this.getFilteredAnomalies().length;
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('Idle Elastic IP').subscribe({
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
                    console.log('Raw anomalies:', this.anomalies);
                    this.updateAccountList();
                    if (this.accountsWithAnomalies.length > 0) {
                        this.selectedAccounts = [this.accountsWithAnomalies[0].value];
                        console.log('Default selectedAccounts:', this.selectedAccounts);
                        this.cdr.detectChanges();
                        this.updateChartData();
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
        console.log('Filtered anomalies:', filtered);
        this.totalRecords = filtered.length;
        return filtered;
    }

    updateChartData(): void {
        const filteredAnomalies = this.getFilteredAnomalies();

        if (this.selectedAccounts.length >= 2) {
            const accountNames = [...new Set(filteredAnomalies.map(anomaly => anomaly.account_name || 'Unknown'))];
            const accountCounts = accountNames.map(accountName =>
                filteredAnomalies.filter(anomaly => (anomaly.account_name || 'Unknown') === accountName).length
            );

            this.accountChartData = {
                labels: accountNames,
                datasets: [{
                    label: 'Number of Elastic IPs',
                    data: accountCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            };
        } else {
            this.accountChartData = { labels: [], datasets: [] };
        }
    }

    onAccountSelectionChange(event: any): void {
        this.selectedAccounts = event.value || [];
        console.log('Selected accounts after change:', this.selectedAccounts);
        this.updateChartData();
    }

    protected readonly JSON = JSON;
}
