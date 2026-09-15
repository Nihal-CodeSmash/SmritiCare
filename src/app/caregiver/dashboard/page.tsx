'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/db';
import type { Alert, DomainScore, Patient, DomainStats } from '@/types';
import styles from './page.module.css';
import { CheckCircle2, TriangleAlert, UserRound } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CaregiverDashboard() {
  const { currentPatient, t } = useApp();
  const [stats, setStats] = useState<DomainStats[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!currentPatient) return;
    
    // Load alerts
    const activeAlerts = await db.alerts
      .where({ patient_id: currentPatient.id, acknowledged: 0 as unknown as boolean })
      .toArray();
    setAlerts(activeAlerts.sort((a, b) => b.created_at.localeCompare(a.created_at)));

    // Load domain stats
    const domains: import('@/types').Domain[] = ['memory', 'attention', 'routine', 'pattern'];
    const newStats: DomainStats[] = [];

    for (const domain of domains) {
      const scores = await db.domainScores
        .where({ patient_id: currentPatient.id, domain })
        .toArray();
      
      const sorted = scores.sort((a, b) => b.score_date.localeCompare(a.score_date));
      const recent = sorted.slice(0, 10).reverse(); // Oldest to newest for chart
      
      if (recent.length > 0) {
        const currentScore = recent[recent.length - 1].score;
        const baselineScore = recent[recent.length - 1].baseline_score;
        
        let trend: DomainStats['trend'] = 'stable';
        if (recent.length >= 3) {
          const oldAvg = (recent[0].score + recent[1].score) / 2;
          const newAvg = (recent[recent.length - 2].score + recent[recent.length - 1].score) / 2;
          if (newAvg < oldAvg - 5) trend = 'declining';
          else if (newAvg > oldAvg + 5) trend = 'improving';
        }

        const hasAlert = activeAlerts.some(a => a.domain === domain);

        newStats.push({
          domain,
          currentScore,
          baselineScore,
          trend: recent.length < 3 ? 'insufficient_data' : trend,
          recentSessions: recent,
          hasAlert
        });
      }
    }
    
    setStats(newStats);
    setLoading(false);
  };

  useEffect(() => {
    if (!currentPatient) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [currentPatient]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcknowledgeAlert = async (id: string) => {
    await db.alerts.update(id, { 
      acknowledged: true, 
      acknowledged_at: new Date().toISOString(),
      sync_status: 'pending' 
    });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getChartData = (domainStat: DomainStats) => {
    return {
      labels: domainStat.recentSessions.map(s => {
        const d = new Date(s.score_date);
        return `${d.getDate()}/${d.getMonth()+1}`;
      }),
      datasets: [
        {
          label: 'Score',
          data: domainStat.recentSessions.map(s => s.score),
          borderColor: domainStat.hasAlert ? '#ef5350' : '#3949ab',
          backgroundColor: domainStat.hasAlert ? 'rgba(239, 83, 80, 0.1)' : 'rgba(57, 73, 171, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: domainStat.hasAlert ? '#c62828' : '#1a237e',
        },
        // Optional baseline if available
        ...(domainStat.baselineScore ? [{
          label: 'Baseline',
          data: Array(domainStat.recentSessions.length).fill(domainStat.baselineScore),
          borderColor: 'rgba(0,0,0,0.2)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }] : [])
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100 },
    },
    plugins: {
      legend: { display: false }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (!currentPatient) {
    return (
      <div className={styles.emptyState}>
        <UserRound className={styles.emptyIcon} size={52} />
        <h2>{t.caregiver.noPatients}</h2>
        <button className="btn-primary" style={{ maxWidth: '200px', marginTop: '1rem' }}>
          {t.caregiver.createPatient}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className="caregiver-card">
          <h3 className={styles.cardTitle}>{t.caregiver.patient}</h3>
          <div className={styles.patientInfo}>
            <div className={styles.avatarLarge}>{currentPatient.display_name.charAt(0)}</div>
            <div>
              <div className={styles.patientName}>{currentPatient.display_name}</div>
              <div className={styles.patientMeta}>Age: {currentPatient.age || '--'} • {currentPatient.preferred_language.toUpperCase()}</div>
            </div>
          </div>
        </div>
        
        <div className="caregiver-card">
          <h3 className={styles.cardTitle}>{t.caregiver.overallTrend}</h3>
          <div className={styles.trendSummary}>
            {alerts.length > 0 ? (
              <span className={styles.trendWarning}><TriangleAlert size={18} /> Review Recommended</span>
            ) : (
              <span className={styles.trendGood}><CheckCircle2 size={18} /> Stable Performance</span>
            )}
            <div className={styles.trendSub}>Based on last 10 sessions</div>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className={styles.alertsPanel}>
          <h3 className={styles.panelTitle}><TriangleAlert size={20} /> Active Alerts</h3>
          <div className={styles.alertList}>
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.type === 'decline' ? 'decline' : 'warning'}`}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertType}>
                    {alert.type === 'decline' ? t.caregiver.alert.decline : alert.type}
                  </span>
                  <span className={styles.alertDomain}>
                    {alert.domain ? t.caregiver.scores[alert.domain] : ''}
                  </span>
                </div>
                <p className={styles.alertMsg}>{alert.message}</p>
                <button 
                  className={styles.ackBtn} 
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Charts */}
      <h3 className={styles.panelTitle}>{t.caregiver.domains}</h3>
      <div className={styles.chartsGrid}>
        {stats.map(stat => (
          <div key={stat.domain} className={`caregiver-card ${stat.hasAlert ? styles.cardAlert : ''}`}>
            <div className={styles.chartHeader}>
              <div>
                <h4 className={styles.chartTitle}>{t.caregiver.scores[stat.domain]}</h4>
                <div className={styles.chartTrend}>
                  {stat.trend === 'declining' && <span className={styles.trendDown}>↓ Declining</span>}
                  {stat.trend === 'improving' && <span className={styles.trendUp}>↑ Improving</span>}
                  {stat.trend === 'stable' && <span className={styles.trendNeutral}>→ Stable</span>}
                  {stat.trend === 'insufficient_data' && <span className={styles.trendNeutral}>Not enough data</span>}
                </div>
              </div>
              <div className={styles.scoreCircle}>
                {stat.currentScore}
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <Line data={getChartData(stat)} options={chartOptions} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
