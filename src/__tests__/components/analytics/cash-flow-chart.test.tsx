import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CashFlowChart, SimpleCashFlowChart } from '@/components/analytics/cash-flow-chart';
import type { CashFlowData } from '@/lib/types/analytics';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ data }: { data: any[] }) => (
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
      Composed Chart
    </div>
  ),
  LineChart: ({ data }: { data: any[] }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name}>
      Line: {dataKey}
    </div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`bar-${dataKey}`} data-name={name}>
      Bar: {dataKey}
    </div>
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-key={dataKey}>
      X Axis
    </div>
  ),
  YAxis: () => <div data-testid="y-axis">Y Axis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">Grid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
}));

const mockCashFlowData: CashFlowData[] = [
  {
    date: '2024-01-01',
    income: 5000,
    expense: 3500,
    netFlow: 1500,
  },
  {
    date: '2024-01-02',
    income: 2000,
    expense: 1800,
    netFlow: 200,
  },
  {
    date: '2024-01-03',
    income: 3000,
    expense: 4000,
    netFlow: -1000,
  },
];

describe('CashFlowChart', () => {
  it('renders the composed chart with default props', () => {
    render(<CashFlowChart data={mockCashFlowData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('renders income and expense bars', () => {
    render(<CashFlowChart data={mockCashFlowData} />);

    expect(screen.getByTestId('bar-income')).toBeInTheDocument();
    expect(screen.getByTestId('bar-expenses')).toBeInTheDocument();
  });

  it('renders net flow line when showNetFlow is true', () => {
    render(<CashFlowChart data={mockCashFlowData} showNetFlow={true} />);

    expect(screen.getByTestId('line-netFlow')).toBeInTheDocument();
  });

  it('does not render net flow line when showNetFlow is false', () => {
    render(<CashFlowChart data={mockCashFlowData} showNetFlow={false} />);

    expect(screen.queryByTestId('line-netFlow')).not.toBeInTheDocument();
  });

  it('passes chart data correctly to the composed chart', () => {
    render(<CashFlowChart data={mockCashFlowData} />);

    const composedChart = screen.getByTestId('composed-chart');
    const chartData = JSON.parse(composedChart.getAttribute('data-chart-data') || '[]');
    expect(chartData).toEqual(mockCashFlowData);
  });

  it('applies custom height when provided', () => {
    const customHeight = 500;
    render(<CashFlowChart data={mockCashFlowData} height={customHeight} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-cash-flow-chart';
    render(<CashFlowChart data={mockCashFlowData} className={customClass} />);

    const chartContainer = screen.getByTestId('responsive-container').parentElement;
    expect(chartContainer).toHaveClass(customClass);
  });

  it('handles empty data gracefully', () => {
    render(<CashFlowChart data={[]} />);

    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    const composedChart = screen.getByTestId('composed-chart');
    const chartData = JSON.parse(composedChart.getAttribute('data-chart-data') || '[]');
    expect(chartData).toEqual([]);
  });
});

describe('SimpleCashFlowChart', () => {
  it('renders the line chart with default props', () => {
    render(<SimpleCashFlowChart data={mockCashFlowData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('renders all three line components', () => {
    render(<SimpleCashFlowChart data={mockCashFlowData} />);

    expect(screen.getByTestId('line-income')).toBeInTheDocument();
    expect(screen.getByTestId('line-expenses')).toBeInTheDocument();
    expect(screen.getByTestId('line-netFlow')).toBeInTheDocument();
  });

  it('passes chart data correctly to the line chart', () => {
    render(<SimpleCashFlowChart data={mockCashFlowData} />);

    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
    expect(chartData).toEqual(mockCashFlowData);
  });

  it('applies custom height when provided', () => {
    const customHeight = 350;
    render(<SimpleCashFlowChart data={mockCashFlowData} height={customHeight} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-simple-chart';
    render(<SimpleCashFlowChart data={mockCashFlowData} className={customClass} />);

    const chartContainer = screen.getByTestId('responsive-container').parentElement;
    expect(chartContainer).toHaveClass(customClass);
  });

  it('handles empty data gracefully', () => {
    render(<SimpleCashFlowChart data={[]} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
    expect(chartData).toEqual([]);
  });
});
