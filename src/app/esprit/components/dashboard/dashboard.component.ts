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
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Service } from '../../models/service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: [],
    providers: [MessageService],
    standalone: true,
    imports: [NgChartsModule, CommonModule, ToastModule, MultiSelectModule, TabViewModule, FormsModule, TableModule]
})
export class DashboardComponent implements OnInit {
    currentDate = new Date();
    loading = false;
    errorMessage = '';
    finOpsData: any = {
        global: {
            monthly_costs: [],
            forecast_cost: 0.0,
            cost_trend: [],
            costs_by_service: [],
            costs_by_dimension: [],
            under_utilized_instances: [],
            budget_count: 0,
            budget_data: [],
            resources_by_service: [],
            ec2_instance_states: { running: 0, stopped: 0 },
            ec2_instance_types: [],
            s3_buckets_size: [],
            s3_top_buckets_object_count: [],
            ebs_volumes: []
        }
    };

    // Constantes pour les limites "Top N"
    private readonly TOP_N_SERVICES = 5;
    private readonly TOP_N_S3_BUCKETS_OBJECT_COUNT = 4;
    private readonly TOP_N_S3_BUCKETS_SIZE = 3;
    private readonly TOP_N_EBS_VOLUMES = 6;

    // Propriétés pour les sommes
    totalEbsSize: number = 0;
    totalS3Size: number = 0;

    // Filtres pour les sélections multiples
    selectedRegions: string[] = [];
    selectedAccountNames: string[] = [];
    availableRegions: { label: string, value: string }[] = [];
    availableAccountNames: { label: string, value: string }[] = [];

    // Graphiques existants
    barChartType: ChartType = 'bar';
    costTrendOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)', font: { size: 14 } } },
            x: {
                title: { display: true, text: 'Service', font: { size: 14 } },
                ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 12 } }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    costTrendData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    underUtilizedChartType: ChartType = 'line';
    underUtilizedChartOptions: ChartOptions<'line'> = {
        scales: {
            y: { beginAtZero: true, max: 10, title: { display: true, text: 'CPU Utilization (%)', font: { size: 14 } } },
            x: {
                title: { display: true, text: 'Instance ID', font: { size: 14 } },
                ticks: { font: { size: 12 } }
            }
        },
        plugins: {
            legend: { position: 'top', labels: { font: { size: 12 } } },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    underUtilizedChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

    resourcesChartType: ChartType = 'pie';
    resourcesChartOptions: ChartOptions<'pie'> = {
        plugins: {
            legend: { position: 'right', labels: { font: { size: 12 } } },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    resourcesChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

    // Coût par compte
    accountCostChartType: ChartType = 'bar';
    accountCostChartOptions: ChartOptions<'bar'> = {
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' ,} }, x: { title: { display: true, text: 'Account Name' } } },
        plugins: { legend: { display: false }, title: { display: true, text: '' } }
    };
    accountCostChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    // Nouveaux graphiques
    ec2StatesChartType: ChartType = 'doughnut';
    ec2StatesChartOptions: ChartOptions<'doughnut'> = {
        plugins: {
            legend: { position: 'right', labels: { font: { size: 12 } } },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    ec2StatesChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

    ec2TypesChartType: ChartType = 'pie';
    ec2TypesChartOptions: ChartOptions<'pie'> = {
        plugins: {
            legend: { position: 'right', labels: { font: { size: 12 } } },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    ec2TypesChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

    s3SizeChartType: ChartType = 'bar';
    s3SizeChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Size (GB)', font: { size: 14 } } },
            x: {
                title: { display: true, text: 'Bucket Name', font: { size: 14 } },
                ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 12 } }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    s3SizeChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    s3TopBucketsChartType: ChartType = 'bar';
    s3TopBucketsChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Object Count', font: { size: 14 } } },
            x: {
                title: { display: true, text: 'Bucket Name', font: { size: 14 } },
                ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 12 } }
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    s3TopBucketsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    ebsVolumesChartType: ChartType = 'bar';
    ebsVolumesChartOptions: ChartOptions<'bar'> = {
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Size (GB)', font: { size: 14 } } },
            x: {
                title: { display: true, text: 'Volume ID', font: { size: 14 } },
                ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 12 } }
            }
        },
        plugins: {
            legend: { position: 'top', labels: { font: { size: 12 } } },
            title: { display: true, text: '', font: { size: 16 } }
        },
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
    };
    ebsVolumesChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

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
                this.availableAccountNames = [
                    { label: 'All', value: 'all' },
                    ...users.map((user) => ({
                        label: user.account_name || user.arn.split('/').pop() || user.arn,
                        value: user.account_name
                    }))
                ];
                if (users.length > 0) {
                    this.selectedAccountNames = [users[0].account_name];
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
                const regions = [...new Set(services.map((service: Service) => service.region || 'Unknown'))].filter(region => region !== 'Unknown');
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

        if (this.selectedAccountNames && this.selectedAccountNames.length > 0 && !this.selectedAccountNames.includes('all')) {
            this.selectedAccountNames.forEach(accountName => {
                params = params.append('account_name', accountName);
            });
        }

        this.finOpsService.getFinOpsOverview(params).subscribe({
            next: (response) => {
                if (response.status === 'success') {
                    this.finOpsData = response.data;
                    console.log('finOpsData:', this.finOpsData); // Debug API response
                    this.updateChartData();
                } else {
                    this.errorMessage = response.message;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message
                    });
                }
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message
                });
                this.loading = false;
            }
        });
    }

    updateChartData(): void {
        const regionsText = this.selectedRegions && this.selectedRegions.length > 0 && !this.selectedRegions.includes('all')
            ? this.selectedRegions.join(', ')
            : this.selectedRegions && this.selectedRegions.length === 0
                ? 'Global Services'
                : 'All Regions';
        const accountsText = this.selectedAccountNames && this.selectedAccountNames.length > 0 && !this.selectedAccountNames.includes('all')
            ? this.selectedAccountNames.join(', ')
            : 'All Accounts';

        // Calcul du mois précédent dynamiquement
        const previousMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        const monthYear = previousMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Liste des services à exclure
        const excludedServices = [
            'budgets', 'AWS Budgets',
            'cost_explorer', 'AWS Cost Explorer',
            'cloudtrail_events', 'AWS CloudTrail', 'CloudTrail',
            'iam', 'AWS IAM'
        ];

        if (this.finOpsData && this.finOpsData.global) {
            const data = this.finOpsData.global;

            // Calcul des sommes pour EBS et S3
            this.totalEbsSize = data.ebs_volumes.reduce((sum: number, vol: any) => sum + (vol.size || 0), 0);
            this.totalS3Size = data.s3_buckets_size.reduce((sum: number, bucket: any) => sum + (bucket.size_gb || 0), 0);

            // Titres des graphiques existants
            this.costTrendOptions.plugins!.title!.text = `Top ${this.TOP_N_SERVICES} Services by Cost (${monthYear}) - ${regionsText} - ${accountsText}`;
            this.underUtilizedChartOptions.plugins!.title!.text = `Under-Utilized EC2 Instances (CPU < 10%) - ${regionsText} - ${accountsText}`;
            this.resourcesChartOptions.plugins!.title!.text = `Resources by Service - ${accountsText}`;

            // Coût par compte
            this.accountCostChartOptions.plugins!.title!.text = `Previous Month Cost by Account (${monthYear}) - ${regionsText}`;
            const previousMonthCosts = this.selectedAccountNames
                .filter(name => name !== 'all')
                .map((account: string) => ({
                    account,
                    cost: data.monthly_costs.find((m: any) => m.month === 'May 2025')?.cost || 0
                }));
            this.accountCostChartData = {
                labels: previousMonthCosts.map((item: any) => item.account),
                datasets: [{
                    label: 'Cost (USD)',
                    data: previousMonthCosts.map((item: any) => item.cost),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            };
            this.accountCostChartOptions = {
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' } }, x: { title: { display: true, text: 'Account Name' } } },
                plugins: { legend: { display: false }, title: { display: true, text: `Previous Month Cost by Account (${monthYear}) - ${regionsText}` } },
                maintainAspectRatio: false,
                layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
            };
            // Données des graphiques existants
            this.costTrendData = {
                labels: data.cost_trend.slice(0, this.TOP_N_SERVICES).map((trend: any) => trend.service),
                datasets: [{ label: 'Cost (USD)', data: data.cost_trend.slice(0, this.TOP_N_SERVICES).map((trend: any) => trend.cost), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
            };

            this.underUtilizedChartData = {
                labels: data.under_utilized_instances.map((instance: any) => instance.instance_id),
                datasets: [{ label: 'Average CPU Utilization (%)', data: data.under_utilized_instances.map((instance: any) => instance.avg_cpu), fill: false, borderColor: 'rgba(153, 102, 255, 0.6)', tension: 0.1 }]
            };

            const filteredResources = data.resources_by_service.filter(
                (service: any) => !excludedServices.includes(service.service)
            );
            this.resourcesChartData = {
                labels: filteredResources.map((service: any) => service.service),
                datasets: [{
                    data: filteredResources.map((service: any) => service.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#AFA8EC'],
                    borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0', '#AFA8EC'],
                    borderWidth: 1
                }]
            };

            // Nouveaux graphiques
            this.ec2StatesChartOptions.plugins!.title!.text = `EC2 Instance States - ${regionsText} - ${accountsText}`;
            this.ec2StatesChartData = {
                labels: ['Running', 'Stopped'],
                datasets: [{
                    data: [data.ec2_instance_states.running, data.ec2_instance_states.stopped],
                    backgroundColor: ['#9966FF99', '#4BC0C099'],
                    borderColor: ['#9966FF99', '#4BC0C099'],
                    borderWidth: 1
                }]
            };

            this.ec2TypesChartOptions.plugins!.title!.text = `EC2 Instance Types - ${regionsText} - ${accountsText}`;
            this.ec2TypesChartData = {
                labels: data.ec2_instance_types.map((type: any) => type.instance_type),
                datasets: [{
                    data: data.ec2_instance_types.map((type: any) => type.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#AFA8EC'],
                    borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0', '#AFA8EC'],
                    borderWidth: 1
                }]
            };

            // Top 3 S3 Buckets Size
            const sortedS3Buckets = [...data.s3_buckets_size].sort((a: any, b: any) => (b.size_gb || 0) - (a.size_gb || 0)).slice(0, this.TOP_N_S3_BUCKETS_SIZE);
            this.s3SizeChartOptions.plugins!.title!.text = `Top ${this.TOP_N_S3_BUCKETS_SIZE} S3 Buckets by Size - ${regionsText} - ${accountsText}`;
            this.s3SizeChartData = {
                labels: sortedS3Buckets.map((bucket: any) => bucket.bucket_name),
                datasets: [{
                    label: 'Size (GB)',
                    data: sortedS3Buckets.map((bucket: any) => bucket.size_gb || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            };

            // Top 4 S3 Buckets by Object Count
            this.s3TopBucketsChartOptions.plugins!.title!.text = `Top ${this.TOP_N_S3_BUCKETS_OBJECT_COUNT} S3 Buckets by Object Count - ${regionsText} - ${accountsText}`;
            this.s3TopBucketsChartData = {
                labels: data.s3_top_buckets_object_count.slice(0, this.TOP_N_S3_BUCKETS_OBJECT_COUNT).map((bucket: any) => bucket.bucket_name),
                datasets: [{
                    label: 'Object Count',
                    data: data.s3_top_buckets_object_count.slice(0, this.TOP_N_S3_BUCKETS_OBJECT_COUNT).map((bucket: any) => bucket.object_count),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            };

            // Top 6 EBS Volumes by Type and Size
            const sortedEbsVolumes = [...data.ebs_volumes].sort((a: any, b: any) => (b.size || 0) - (a.size || 0)).slice(0, this.TOP_N_EBS_VOLUMES);
            const volumeTypes = [...new Set(data.ebs_volumes.map((vol: any) => vol.volume_type))] as string[];
            const colorMap: { [key: string]: string } = {
                'gp2': '#FF6384',
                'gp3': '#36A2EB',
                'standard': '#FFCE56',
                'io1': '#4BC0C0',
                'io2': '#9966FF',
                'sc1': '#FF9F40',
                'st1': '#C9CBCF'
            };
            this.ebsVolumesChartOptions.plugins!.title!.text = `Top ${this.TOP_N_EBS_VOLUMES} EBS Volumes by Type and Size - ${regionsText} - ${accountsText}`;
            this.ebsVolumesChartData = {
                labels: sortedEbsVolumes.map((vol: any) => vol.volume_id),
                datasets: volumeTypes.map(type => ({
                    label: type,
                    data: sortedEbsVolumes.map((vol: any) => vol.volume_type === type ? vol.size : 0),
                    backgroundColor: colorMap[type] || '#AFA8EC',
                    borderColor: colorMap[type] ? colorMap[type].replace('0.6', '1') : '#AFA8EC',
                    borderWidth: 1
                }))
            };

        } else if (this.finOpsData && this.selectedAccountNames.length > 0) {
            const accountName = this.selectedAccountNames[0];
            if (this.finOpsData[accountName]) {
                const data = this.finOpsData[accountName];
                const accountLabel = this.availableAccountNames.find(a => a.value === accountName)?.label || accountName;

                // Calcul des sommes pour EBS et S3
                this.totalEbsSize = data.ebs_volumes.reduce((sum: number, vol: any) => sum + (vol.size || 0), 0);
                this.totalS3Size = data.s3_buckets_size.reduce((sum: number, bucket: any) => sum + (bucket.size_gb || 0), 0);

                // Titres des graphiques existants
                this.costTrendOptions.plugins!.title!.text = `Top ${this.TOP_N_SERVICES} Services by Cost (${monthYear}) - ${accountLabel} - ${regionsText}`;
                this.underUtilizedChartOptions.plugins!.title!.text = `Under-Utilized EC2 Instances (CPU < 10%) - ${accountLabel} - ${regionsText}`;
                this.resourcesChartOptions.plugins!.title!.text = `Resources by Service - ${accountLabel}`;

                // Coût par compte (version antérieure)
                this.accountCostChartOptions.plugins!.title!.text = `Previous Month Cost by Account (${monthYear}) - ${regionsText}`;
                const previousMonthCosts = this.selectedAccountNames
                    .filter(name => name !== 'all')
                    .map((account: string) => ({
                        account,
                        cost: data.monthly_costs.find((m: any) => m.month === 'May 2025')?.cost || 0
                    }));
                this.accountCostChartData = {
                    labels: previousMonthCosts.map((item: any) => item.account),
                    datasets: [{
                        label: 'Cost (USD)',
                        data: previousMonthCosts.map((item: any) => item.cost),
                        backgroundColor: 'rgba(255, 159, 64, 0.6)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }]
                };
                this.accountCostChartOptions = {
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'Cost (USD)' } }, x: { title: { display: true, text: 'Account Name' } } },
                    plugins: { legend: { display: false }, title: { display: true, text: `Previous Month Cost by Account (${monthYear}) - ${regionsText}` } },
                    maintainAspectRatio: false,
                    layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } }
                };

                // Données des graphiques existants
                this.costTrendData = {
                    labels: data.cost_trend.slice(0, this.TOP_N_SERVICES).map((trend: any) => trend.service),
                    datasets: [{ label: 'Cost (USD)', data: data.cost_trend.slice(0, this.TOP_N_SERVICES).map((trend: any) => trend.cost), backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
                };

                this.underUtilizedChartData = {
                    labels: data.under_utilized_instances.map((instance: any) => instance.instance_id),
                    datasets: [{ label: 'Average CPU Utilization (%)', data: data.under_utilized_instances.map((instance: any) => instance.avg_cpu), fill: false, borderColor: 'rgba(153, 102, 255, 0.6)', tension: 0.1 }]
                };

                const filteredResources = data.resources_by_service.filter(
                    (service: any) => !excludedServices.includes(service.service)
                );
                this.resourcesChartData = {
                    labels: filteredResources.map((service: any) => service.service),
                    datasets: [{
                        data: filteredResources.map((service: any) => service.count),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#AFA8EC'],
                        borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0', '#AFA8EC'],
                        borderWidth: 1
                    }]
                };

                // Nouveaux graphiques
                this.ec2StatesChartOptions.plugins!.title!.text = `EC2 Instance States - ${accountLabel} - ${regionsText}`;
                this.ec2StatesChartData = {
                    labels: ['Running', 'Stopped'],
                    datasets: [{
                        data: [data.ec2_instance_states.running, data.ec2_instance_states.stopped],
                        backgroundColor: ['#000000', '#ffcc4c'],
                        borderColor: ['#000000', '#ccad33'],
                        borderWidth: 1
                    }]
                };

                this.ec2TypesChartOptions.plugins!.title!.text = `EC2 Instance Types - ${accountLabel} - ${regionsText}`;
                this.ec2TypesChartData = {
                    labels: data.ec2_instance_types.map((type: any) => type.instance_type),
                    datasets: [{
                        data: data.ec2_instance_types.map((type: any) => type.count),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#AFA8EC'],
                        borderColor: ['#FF4066', '#1E7ACF', '#E6B800', '#3DA8A8', '#7D4DE0', '#FF751A', '#A6A9B0', '#AFA8EC'],
                        borderWidth: 1
                    }]
                };

                // Top 3 S3 Buckets Size
                const sortedS3Buckets = [...data.s3_buckets_size].sort((a: any, b: any) => (b.size_gb || 0) - (a.size_gb || 0)).slice(0, this.TOP_N_S3_BUCKETS_SIZE);
                this.s3SizeChartOptions.plugins!.title!.text = `Top ${this.TOP_N_S3_BUCKETS_SIZE} S3 Buckets by Size - ${accountLabel} - ${regionsText}`;
                this.s3SizeChartData = {
                    labels: sortedS3Buckets.map((bucket: any) => bucket.bucket_name),
                    datasets: [{
                        label: 'Size (GB)',
                        data: sortedS3Buckets.map((bucket: any) => bucket.size_gb || 0),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                };

                // Top 4 S3 Buckets by Object Count
                this.s3TopBucketsChartOptions.plugins!.title!.text = `Top ${this.TOP_N_S3_BUCKETS_OBJECT_COUNT} S3 Buckets by Object Count - ${accountLabel} - ${regionsText}`;
                this.s3TopBucketsChartData = {
                    labels: data.s3_top_buckets_object_count.slice(0, this.TOP_N_S3_BUCKETS_OBJECT_COUNT).map((bucket: any) => bucket.bucket_name),
                    datasets: [{
                        label: 'Object Count',
                        data: data.s3_top_buckets_object_count.slice(0, this.TOP_N_S3_BUCKETS_OBJECT_COUNT).map((bucket: any) => bucket.object_count),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                };

                // Top 6 EBS Volumes by Type and Size
                const sortedEbsVolumes = [...data.ebs_volumes].sort((a: any, b: any) => (b.size || 0) - (a.size || 0)).slice(0, this.TOP_N_EBS_VOLUMES);
                const volumeTypes = [...new Set(data.ebs_volumes.map((vol: any) => vol.volume_type))] as string[];
                const colorMap: { [key: string]: string } = {
                    'gp2': '#FF6384',
                    'gp3': '#36A2EB',
                    'standard': '#FFCE56',
                    'io1': '#4BC0C0',
                    'io2': '#9966FF',
                    'sc1': '#FF9F40',
                    'st1': '#C9CBCF'
                };
                this.ebsVolumesChartOptions.plugins!.title!.text = `Top ${this.TOP_N_EBS_VOLUMES} EBS Volumes by Type and Size - ${accountLabel} - ${regionsText}`;
                this.ebsVolumesChartData = {
                    labels: sortedEbsVolumes.map((vol: any) => vol.volume_id),
                    datasets: volumeTypes.map(type => ({
                        label: type,
                        data: sortedEbsVolumes.map((vol: any) => vol.volume_type === type ? vol.size : 0),
                        backgroundColor: colorMap[type] || '#AFA8EC',
                        borderColor: colorMap[type] ? colorMap[type].replace('0.6', '1') : '#AFA8EC',
                        borderWidth: 1
                    }))
                };
            }
        }
    }

    onFilterChange(): void {
        this.loadFinOpsData();
    }
}
