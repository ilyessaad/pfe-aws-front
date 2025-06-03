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
import {AnomalyErrorResponse, AnomalySuccessResponse} from "../../../service/anomaly.service";

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

    // Dropdown filter for users
    usersWithAnomalies: { label: string; value: number }[] = [];
    selectedUsers: number[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Configuration du graphique pour Elastic IPs par utilisateur (Bar Chart)
    userIpChartType: ChartType = 'bar';
    userIpChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Elastic IPs' }
            },
            x: {
                title: { display: true, text: 'User ID' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Elastic IPs by User' }
        }
    };
    userIpChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    constructor(
        private anomalyService: AnomalyService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef // Added for manual change detection
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
                    this.updateUserList();
                    if (this.usersWithAnomalies.length > 0) {
                        this.selectedUsers = [this.usersWithAnomalies[0].value];
                        console.log('Default selectedUsers:', this.selectedUsers); // Debug log
                        this.cdr.detectChanges(); // Force change detection
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

    updateUserList(): void {
        const uniqueUsers = [...new Set(this.anomalies.map(anomaly => anomaly.user_id))].filter(user => user !== undefined);
        this.usersWithAnomalies = uniqueUsers.map(user => ({ label: `User ${user}`, value: user }));
        console.log('usersWithAnomalies:', this.usersWithAnomalies); // Debug log
    }

    getFilteredAnomalies(): Anomaly[] {
        const filtered = this.selectedUsers.length > 0 ? this.anomalies.filter(anomaly => this.selectedUsers.includes(anomaly.user_id)) : [];
        console.log('Filtered anomalies:', filtered);
        this.totalRecords = filtered.length;
        return filtered;
    }

    updateChartData(): void {
        const filteredAnomalies = this.getFilteredAnomalies();

        if (this.selectedUsers.length >= 2) {
            const userIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.user_id))].filter(id => id !== undefined);
            const userCounts = userIds.map(userId =>
                filteredAnomalies.filter(anomaly => anomaly.user_id === userId).length
            );

            this.userIpChartData = {
                labels: userIds.map(id => `User ${id}`),
                datasets: [{
                    label: 'Number of Elastic IPs',
                    data: userCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            };
        } else {
            this.userIpChartData = { labels: [], datasets: [] };
        }
    }

    onUserSelectionChange(event: any): void {
        this.selectedUsers = event.value || [];
        console.log('Selected users after change:', this.selectedUsers); // Debug log
        this.updateChartData();
    }

    protected readonly JSON = JSON;
}
