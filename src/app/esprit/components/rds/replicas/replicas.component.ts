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
    selector: 'app-replicas',
    templateUrl: './replicas.component.html',
    styleUrls: ['./replicas.component.scss'],
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
export class ReplicasComponent implements OnInit, AfterViewInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // MultiSelect for users
    usersWithAnomalies: { label: string; value: number }[] = [];
    selectedUsers: number[] = [];

    // Pagination properties
    rowsPerPage: number = 5;
    totalRecords: number = 0;

    // Bar Chart for engine types with count
    engineChartType: ChartType = 'bar';
    engineChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                    stepSize: 1
                },
                title: { display: true, text: 'Count by Engine Type' }
            },
            x: {
                title: { display: true, text: 'Engine Type' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'RDS Read Replicas by Engine' },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const anomaly = this.getFilteredAnomalies().find(a => a.details?.engine === tooltipItem.label);
                        return [
                            `Version: ${anomaly?.details?.engine_version || 'Unknown'}`,
                            `Instances: ${tooltipItem.raw}`
                        ];
                    }
                }
            }
        }
    };
    engineChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Bar Chart for db_instance_identifier and read_replica_source
    replicaSourceChartType: ChartType = 'bar';
    replicaSourceChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Count' }
            },
            x: {
                title: { display: true, text: 'DB Instance Identifier' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Read Replica Sources' }
        }
    };
    replicaSourceChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Bar Chart for db_instance_identifier and metrics
    metricsChartType: ChartType = 'bar';
    metricsChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Metrics Value' }
            },
            x: {
                title: { display: true, text: 'DB Instance Identifier' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Metrics by DB Instance' }
        }
    };
    metricsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Bar Chart for replicas per user
    userReplicasChartType: ChartType = 'bar';
    userReplicasChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                    stepSize: 1
                },
                title: { display: true, text: 'Number of Replicas' }
            },
            x: {
                title: { display: true, text: 'User ID' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Replicas per User' }
        }
    };
    userReplicasChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

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
        this.anomalyService.getAnomalies('AWS RDS Read Replicas Not Used').subscribe({
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

        // Calculate replicas per user
        const replicasPerUserMap: { [key: number]: number } = {};
        filteredAnomalies.forEach(anomaly => {
            if (anomaly.user_id !== undefined) {
                replicasPerUserMap[anomaly.user_id] = (replicasPerUserMap[anomaly.user_id] || 0) + 1;
            }
        });
        const userIds = Object.keys(replicasPerUserMap).map(Number);
        const userCounts = userIds.map(userId => replicasPerUserMap[userId]);

        this.userReplicasChartData = {
            labels: userIds.map(id => `User ${id}`),
            datasets: [{
                label: 'Number of Replicas',
                data: userCounts,
                backgroundColor: 'rgba(75, 192, 192, 0.6)' // Teal
            }]
        };
        console.log('User replicas chart data:', this.userReplicasChartData);

        // Bar Chart for engine types with count
        const engines = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.engine))].filter(engine => engine);
        const engineCounts = engines.map(engine =>
            filteredAnomalies.filter(anomaly => anomaly.details?.engine === engine).length
        );

        this.engineChartData = {
            labels: engines,
            datasets: [{
                label: 'Count by Engine Type',
                data: engineCounts,
                backgroundColor: 'rgba(255, 215, 0, 0.6)' // Yellow
            }]
        };
        console.log('Engine chart data:', this.engineChartData);

        // Bar Chart for db_instance_identifier and read_replica_source
        const dbInstanceIds = [...new Set(filteredAnomalies.map(anomaly => anomaly.details?.db_instance_identifier))].filter(id => id);
        const replicaSourceCounts = dbInstanceIds.map(id => {
            const anomaliesWithSource = filteredAnomalies.filter(a => a.details?.db_instance_identifier === id && a.details?.read_replica_source);
            return anomaliesWithSource.length > 0 ? 1 : 0; // Presence indicator
        });

        this.replicaSourceChartData = {
            labels: dbInstanceIds,
            datasets: [{
                label: 'Read Replica Source',
                data: replicaSourceCounts,
                backgroundColor: 'rgba(0, 0, 0, 0.6)' // Black
            }]
        };
        console.log('Replica source chart data:', this.replicaSourceChartData);

        // Bar Chart for db_instance_identifier and metrics
        const metricsData = dbInstanceIds.map(id => {
            const anomaly = filteredAnomalies.find(a => a.details?.db_instance_identifier === id);
            return anomaly?.details?.metrics || 0; // Assuming metrics is a numeric value
        });

        this.metricsChartData = {
            labels: dbInstanceIds,
            datasets: [{
                label: 'Metrics',
                data: metricsData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)' // Blue
            }]
        };
        console.log('Metrics chart data:', this.metricsChartData);
    }

    onUserSelectionChange(): void {
        console.log('Selected users after change:', this.selectedUsers);
        this.updateCharts();
    }

    protected readonly JSON = JSON;
}
