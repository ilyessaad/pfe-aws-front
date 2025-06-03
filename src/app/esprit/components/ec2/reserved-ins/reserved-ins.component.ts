import { Component, OnInit } from '@angular/core';
import { AnomalyService, Anomaly, AnomalyResponse } from '../../../service/anomaly.service';
import { MessageService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import {AnomalyErrorResponse, AnomalySuccessResponse} from "../../../service/anomaly.service";
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-reserved-ins',
    templateUrl: './reserved-ins.component.html',
    styleUrls: ['./reserved-ins.component.scss'],
    providers: [MessageService],
    standalone: true,
    imports: [NgChartsModule, CommonModule, ToastModule, TableModule, CheckboxModule, FormsModule]
})
export class ReservedInsComponent implements OnInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // Checkbox filter for users
    usersWithAnomalies: { label: string; value: number }[] = [];
    selectedUsers: number[] = [];

    // Configuration du graphique pour les instances réservées par type (Bar Chart)
    instanceTypeChartType: ChartType = 'bar';
    instanceTypeChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Count per Instance Type' }
            },
            x: {
                title: { display: true, text: 'Instance ID' }
            }
        },
        plugins: {
            legend: { display: true },
            title: { display: true, text: 'Reserved Instances by Type' }
        }
    };
    instanceTypeChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Configuration du graphique pour les instances réservées par utilisateur (Bar Chart)
    userChartType: ChartType = 'bar';
    userChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Reserved Instances' }
            },
            x: {
                title: { display: true, text: 'User ID' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Reserved Instances by User' }
        }
    };
    userChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    constructor(
        private anomalyService: AnomalyService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadAnomalies();
    }

    // Getter for the total number of reserved instances
    get numberOfReservedInstances(): number {
        return this.getFilteredAnomalies().length;
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('AWS EC2 Reserved Instances Expiring Soon').subscribe({
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
                    this.updateUserList();
                    this.updateChartData();
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

    // Update the list of users with anomalies for the checkbox
    updateUserList(): void {
        const uniqueUsers = [...new Set(this.anomalies.map(anomaly => anomaly.user_id))].filter(user => user !== undefined);
        this.usersWithAnomalies = uniqueUsers.map(user => ({ label: `User ${user}`, value: user }));
    }

    // Get filtered anomalies based on selected users
    getFilteredAnomalies(): Anomaly[] {
        return this.selectedUsers.length > 0 ? this.anomalies.filter(anomaly => this.selectedUsers.includes(anomaly.user_id)) : this.anomalies;
    }

    updateChartData(): void {
        const filteredAnomalies = this.getFilteredAnomalies();

        // Update Bar Chart: Reserved Instances by Type
        const instanceIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.instance_id || 'Unknown'))];
        const instanceTypes = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.instance_type || 'Unknown'))];
        const typeCounts: { [key: string]: number[] } = {};

        instanceIds.forEach(instanceId => {
            typeCounts[instanceId] = instanceTypes.map(type =>
                filteredAnomalies.filter(a => a.details?.instance_id === instanceId && a.details?.instance_type === type).length
            );
        });

        this.instanceTypeChartData = {
            labels: instanceIds,
            datasets: instanceTypes.map((type, index) => ({
                label: type,
                data: instanceIds.map(id => typeCounts[id][index] || 0),
                backgroundColor: `rgba(255, 99, 132, ${0.6 - index * 0.1})`
            }))
        };

        // Update Bar Chart: Reserved Instances by User
        const userIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.user_id))];
        const userCounts = userIds.map(userId =>
            filteredAnomalies.filter(anomaly => anomaly.user_id === userId).length
        );

        this.userChartData = {
            labels: userIds.map(id => `User ${id}`),
            datasets: [{
                label: 'Number of Reserved Instances',
                data: userCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        };
    }

    onUserSelectionChange(): void {
        this.updateChartData();
    }

    protected readonly JSON = JSON;
}
