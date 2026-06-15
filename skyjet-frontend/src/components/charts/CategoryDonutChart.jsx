import React from 'react';
import ReactApexChart from 'react-apexcharts';

export default function CategoryDonutChart({ categories = [], compact = false }) {
  const labels = categories.map((category) => category.name || 'Unknown');
  const seriesData = categories.map((category) => category.feedback_count || 0);

  const options = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    labels,
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270,
        donut: {
          size: '65%',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const index = opts.seriesIndex;
        return seriesData[index];
      },
      style: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#fff',
      },
      dropShadow: {
        enabled: true,
      },
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      y: {
        formatter: (val) => val + ' feedback',
      },
    },
    fill: {
      type: 'gradient',
    },
    legend: {
      show: false,
    },
    title: {
      text: compact ? '' : 'Category distribution',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
              const index = opts.seriesIndex;
              return seriesData[index];
            },
            fontSize: '11px',
          },
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
              },
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
              const index = opts.seriesIndex;
              return seriesData[index];
            },
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
            },
          },
          tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
              formatter: (val) => val + ' feedback',
            },
          },
          plotOptions: {
            pie: {
              donut: {
                size: '55%',
              },
            },
          },
          chart: {
            width: '100%',
          },
        },
      },
      {
        breakpoint: 480,
        options: {
          dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
              const index = opts.seriesIndex;
              return seriesData[index];
            },
            style: {
              fontSize: '11px',
              fontWeight: 'bold',
            },
          },
          tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
              formatter: (val) => val + ' feedback',
            },
          },
          plotOptions: {
            pie: {
              donut: {
                size: '50%',
              },
            },
          },
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  return (
    <div className="category-donut-chart">
      {seriesData.length > 0 ? (
        <>
          <div className="category-chart-top">
            <ReactApexChart options={options} series={seriesData} type="donut" width="100%" height={compact ? 180 : 280} />
          </div>
          {!compact && (
            <div className="category-chart-details">
              {categories.map((category) => (
                <div key={category.id} className="category-chart-row">
                  <span className="category-dot" style={{ background: category.color || '#2563EB' }} />
                  <div className="category-chart-meta">
                    <span className="category-chart-name">{category.name || 'Unknown'}</span>
                    <span className="category-chart-count">{category.feedback_count || 0} feedback</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">No category data available yet.</div>
      )}
    </div>
  );
}
