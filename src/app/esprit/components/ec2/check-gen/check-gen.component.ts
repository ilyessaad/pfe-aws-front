import { Component, OnInit } from '@angular/core';
import {
    AnomalyService,
    Anomaly,
    AnomalyResponse,
    AnomalySuccessResponse,
    AnomalyErrorResponse
} from '../../../service/anomaly.service';
import { MessageService } from 'primeng/api';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-check-gen',
    templateUrl: './check-gen.component.html',
    styleUrls: ['./check-gen.component.scss'],
    providers: [MessageService],
    standalone: true,
    imports: [NgChartsModule, CommonModule, ToastModule, TableModule]
})
export class CheckGenComponent implements OnInit {
    anomalies: Anomaly[] = [];
    loading = false;
    errorMessage = '';

    // Configuration du graphique pour les anciennes générations EC2 (Bar Chart)
    olderGenChartType: ChartType = 'bar';
    olderGenChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Number of Instances' },
                ticks: { stepSize: 1 },
                max: 8 // Set maximum value to 8
            },
            x: {
                title: { display: true, text: 'Region' }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'EC2 Instances Running Older Generation Hardware by Region' }
        }
    };
    olderGenChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Configuration du graphique pour les instances et leurs types (Bar Chart)
    instanceTypeChartType: ChartType = 'bar';
    instanceTypeChartOptions: ChartOptions<'bar'> = {
        scales: {
            x: {
                type: 'category',
                title: { display: true, text: 'Instance ID' }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Count by Instance Type' },
                ticks: { stepSize: 1 },
                max: 4
            }
        },
        plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: 'Instances by ID and Type' }
        }
    };
    instanceTypeChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    constructor(
        private anomalyService: AnomalyService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadAnomalies();
    }

    // Getter for the total number of instances
    get numberOfInstances(): number {
        return this.anomalies.length;
    }

    loadAnomalies(): void {
        this.loading = true;
        this.anomalyService.getAnomalies('AWS EC2 Instances Running Older Generation Hardware').subscribe({
            next: (response: AnomalyResponse) => {
                if (response.status === 'success') {
                    this.anomalies = (response as AnomalySuccessResponse).data;
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

    updateChartData(): void {
        // Update Bar Chart: Number of Instances per Region
        const regionCounts: { [key: string]: number } = {};
        this.anomalies.forEach(anomaly => {
            const region = anomaly.region || 'Unknown';
            regionCounts[region] = (regionCounts[region] || 0) + 1;
        });

        this.olderGenChartData = {
            labels: Object.keys(regionCounts),
            datasets: [{
                label: 'Number of Instances',
                data: Object.values(regionCounts),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            }]
        };

        // Update Bar Chart: Instances by ID and Type
        const instanceIds = [...new Set(this.anomalies.map(anomaly => anomaly.details?.instance_id || 'Unknown'))];
        const instanceTypes = [...new Set(this.anomalies.map(anomaly => anomaly.details?.instance_type || 'Unknown'))];

        // Prepare datasets for each instance type
        const datasets = instanceTypes.map((type, index) => {
            const data = instanceIds.map(instanceId => {
                const count = this.anomalies.filter(anomaly =>
                    (anomaly.details?.instance_id || 'Unknown') === instanceId &&
                    (anomaly.details?.instance_type || 'Unknown') === type
                ).length;
                return count;
            });
            return {
                label: type,
                data: data,
                backgroundColor: `rgba(${index * 50 % 255}, ${150 - index * 30 % 255}, ${200 + index * 20 % 255}, 0.6)`,
                borderColor: `rgba(${index * 50 % 255}, ${150 - index * 30 % 255}, ${200 + index * 20 % 255}, 1)`,
                borderWidth: 1
            };
        });

        this.instanceTypeChartData = {
            labels: instanceIds, // X-axis: instance IDs
            datasets: datasets
        };
    }

    protected readonly JSON = JSON;
}
