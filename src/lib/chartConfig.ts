import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * Get CSS variable value from computed styles
 */
function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') {
    return ''
  }
  const root = document.documentElement
  return getComputedStyle(root).getPropertyValue(variable).trim()
}

/**
 * Get theme colors for Chart.js
 */
export function getChartThemeColors() {
  return {
    background: getCSSVariable('--background') || 'hsl(0 0% 100%)',
    foreground: getCSSVariable('--foreground') || 'hsl(222.2 84% 4.9%)',
    muted: getCSSVariable('--muted') || 'hsl(210 40% 96.1%)',
    mutedForeground: getCSSVariable('--muted-foreground') || 'hsl(215.4 16.3% 46.9%)',
    border: getCSSVariable('--border') || 'hsl(214.3 31.8% 91.4%)',
    card: getCSSVariable('--card') || 'hsl(0 0% 100%)',
    cardForeground: getCSSVariable('--card-foreground') || 'hsl(222.2 84% 4.9%)',
  }
}

/**
 * Get default Chart.js options with theme support
 */
export function getDefaultChartOptions(): Partial<ChartOptions<'line'>> {
  const colors = getChartThemeColors()

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20, // Extra padding for rotated X-axis labels
        top: 10,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: colors.mutedForeground,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: colors.card,
        titleColor: colors.cardForeground,
        bodyColor: colors.cardForeground,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          labelColor: () => ({
            borderColor: 'transparent',
            backgroundColor: 'transparent',
          }),
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: colors.border,
          lineWidth: 1,
          drawOnChartArea: true,
          drawTicks: false,
        },
        ticks: {
          color: colors.mutedForeground,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        border: {
          color: colors.border,
        },
      },
      y: {
        grid: {
          display: true,
          color: colors.border,
          lineWidth: 1,
          drawOnChartArea: true,
          drawTicks: false,
        },
        ticks: {
          color: colors.mutedForeground,
          font: {
            size: 11,
          },
        },
        border: {
          color: colors.border,
        },
      },
    },
  }
}

/**
 * Create chart options with custom configuration
 */
export function createChartOptions(
  customOptions: Partial<ChartOptions<'line'>> = {}
): ChartOptions<'line'> {
  const defaultOptions = getDefaultChartOptions()
  return {
    ...defaultOptions,
    ...customOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...(customOptions.plugins || {}),
    },
    scales: {
      ...defaultOptions.scales,
      ...(customOptions.scales || {}),
    },
  } as ChartOptions<'line'>
}
