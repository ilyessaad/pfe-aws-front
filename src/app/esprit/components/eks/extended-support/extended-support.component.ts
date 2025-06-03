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
    selector: 'app-extended-support',
    templateUrl: './extended-support.component.html',
    styleUrls: ['./extended-support.component.scss'],
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
export class ExtendedSupportComponent implements OnInit, AfterViewInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // MultiSelect for users
    usersWithAnomalies: { label: string; value: number }[] = [];
    selectedUsers: number[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Bar Chart for number of EKS clusters per user
    userEksChartType: ChartType = 'bar';
    userEksChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of EKS Clusters' }
            },
            x: {
                title: { display: true, text: 'User ID' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Number of EKS Clusters by User' }
        }
    };
    userEksChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    constructor(
        private anomalyService: AnomalyService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadAnomalies();
    }

    ngAfterViewInit(): void {
        if (this.usersWithAnomalies.length > 0 && this.selectedUsers.length === 0) {
            this.selectedUsers = [this.usersWithAnomalies[0].value];
            console.log('Default selectedUsers in ngAfterViewInit:', this.selectedUsers);
            this.cdr.detectChanges();
            this.updateCharts();
        } else {
            console.log('ngAfterViewInit: usersWithAnomalies is empty or selectedUsers already set', {
                usersWithAnomalies: this.usersWithAnomalies,
                selectedUsers: this.selectedUsers
            });
        }
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('AWS EKS Clusters Extended Support Version').subscribe({
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
                    console.log('Raw anomalies data:', this.anomalies);
                    if (this.anomalies.length === 0) {
                        console.log('No anomalies data received from API');
                    }
                    this.updateUserList();
                    if (this.usersWithAnomalies.length > 0 && this.selectedUsers.length === 0) {
                        this.selectedUsers = [this.usersWithAnomalies[0].value];
                        console.log('Default selectedUsers in loadAnomalies:', this.selectedUsers);
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

    updateUserList(): void {
        const uniqueUsers = [...new Set(this.anomalies.map(anomaly => anomaly.user_id))].filter(user => user !== undefined);
        this.usersWithAnomalies = uniqueUsers.map(user => ({ label: `User ${user}`, value: user }));
        console.log('usersWithAnomalies:', this.usersWithAnomalies);
    }

    getFilteredAnomalies(): Anomaly[] {
        const filtered = this.selectedUsers.length > 0 ? this.anomalies.filter(anomaly => this.selectedUsers.includes(anomaly.user_id)) : [];
        this.totalRecords = filtered.length;
        console.log('Filtered anomalies:', filtered);
        return filtered;
    }

    updateCharts(): void {
        const filteredAnomalies = this.getFilteredAnomalies();

        // Bar Chart for Number of EKS Clusters per User (always displayed)
        const userIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.user_id))].filter(id => id !== undefined);
        const userCounts = userIds.map(userId =>
            filteredAnomalies.filter(anomaly => anomaly.user_id === userId).length
        );

        this.userEksChartData = {
            labels: userIds.map(id => `User ${id}`),
            datasets: [{
                label: 'Number of EKS Clusters',
                data: userCounts,
                backgroundColor: 'rgba(0, 0, 0, 0.6)' // Black
            }]
        };
        console.log('User EKS chart data:', this.userEksChartData);
    }

    onUserSelectionChange(): void {
        console.log('Selected users after change:', this.selectedUsers);
        this.updateCharts();
    }

    protected readonly JSON = JSON;
}
