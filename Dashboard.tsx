/**
 * Dashboard component for the rewards administration system.
 * Displays analytics charts, leaderboards, and a changelog.
 * Features:
 * - Date range filtering for all data
 * - Scans/redeems trend visualization
 * - Member leaderboard
 * - Responsive layout with Material-UI
 */
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Grid2 as Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ReactMarkdown from 'react-markdown';
import { siteName } from "../lib";
import changelogText from "../CHANGELOG.md?raw"; // Raw markdown import
import { useDataProvider, Loading } from "react-admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// ======================
// Type Definitions
// ======================
interface ScanLog {
  id: number;
  member_id: number;
  created_at: string;
}

interface Member {
  id: number;
  name: string;
}

interface RedeemLog {
  id: number;
  member_id: number;
  created_at: string;
}

export const Dashboard = () => {
  const dataProvider = useDataProvider();
  // State for data and loading/error handling
  const [scanLogs, setScanLogs] = React.useState<ScanLog[]>([]);
  const [members, setMembers] = React.useState<Record<number, Member>>({});
  const [redeemLogs, setRedeemLogs] = React.useState<RedeemLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Default date range: last 30 days
  const [dateRange, setDateRange] = React.useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 29)),
    endDate: new Date(),
  });

  // ======================
  // Data Fetching
  // ======================
  React.useEffect(() => {
    // Fetch scan logs, members, and redeem logs in sequence
    dataProvider
      .getList("scan_logs", {
        pagination: { page: 1, perPage: 5000 }, // High perPage for demo purposes
        sort: { field: "created_at", order: "DESC" },
      })
      .then(({ data: scanLogData }) => {
        setScanLogs(scanLogData);
        return dataProvider.getList("members", {
          pagination: { page: 1, perPage: 500 },
          sort: { field: "id", order: "ASC" },
        });
      })
      .then(({ data: memberData }) => {
        // Convert member array to map for O(1) lookups
        const memberMap = memberData.reduce((acc, member) => {
          acc[member.id] = member;
          return acc;
        }, {} as Record<number, Member>);
        setMembers(memberMap);
        return dataProvider.getList("redeem_logs", {
          pagination: { page: 1, perPage: 500 },
          sort: { field: "created_at", order: "ASC" },
        });
      })
      .then(({ data: redeemLogData }) => {
        setRedeemLogs(redeemLogData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Data fetch error:", error);
        setError(error);
        setLoading(false);
      });
  }, [dataProvider]);

  if (loading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  // ======================
  // Data Processing
  // ======================
  /** Filters logs based on the selected date range */
  const filterLogsByDate = (logs: { created_at: string }[]) => {
    return logs.filter((log) => {
      const logDate = new Date(log.created_at);
      return logDate >= dateRange.startDate && logDate <= dateRange.endDate;
    });
  };

  const filteredScanLogs = filterLogsByDate(scanLogs);
  const filteredRedeemLogs = filterLogsByDate(redeemLogs);

  /** Aggregates scans by date for charting */
  const scansByDate = filteredScanLogs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  /** Formats scan data for Recharts */
  const scanData = Object.keys(scansByDate).map((date) => ({
    date,
    scans: scansByDate[date],
  }));

  /** Calculates top 10 members by scan count */
  const leaderboard = filteredScanLogs.reduce((acc, log) => {
    acc[log.member_id] = (acc[log.member_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const leaderboardData = Object.entries(leaderboard)
    .map(([memberId, scans]) => ({
      memberId: parseInt(memberId, 10),
      scans,
      name: members[parseInt(memberId, 10)]?.name || "Unknown",
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10);

  /** Aggregates redeems by date for charting */
  const rewardsRedeemedData = Object.keys(
    filteredRedeemLogs.reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map((date) => ({ date, rewards: rewardsRedeemedByDate[date] }));

  // ======================
  // Event Handlers
  // ======================
  const handleDateRangeChange = (ranges: any) => {
    setDateRange({
      startDate: ranges.selection.startDate,
      endDate: ranges.selection.endDate,
    });
  };

  // ======================
  // UI Components
  // ======================
  return (
    <Card>
      <CardHeader title={`${siteName} Rewards Administration`} />
      <CardContent>
        <Grid container spacing={2}>
          {/* Welcome Card with Logo */}
          <Grid size={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Welcome to the Rewards Administration dashboard for {siteName}.
                </Typography>
                <CardMedia component="img" height="300" image="/logo.png" />
              </CardContent>
            </Card>
          </Grid>

          {/* Date Range Picker */}
          <Grid size={6}>
            <Card>
              <CardContent>
                <Typography align="center" variant="h6">
                  Date Range Picker
                </Typography>
                <hr />
                <DateRangePicker
                  ranges={[{ ...dateRange, key: "selection" }]}
                  onChange={handleDateRangeChange}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Leaderboard Table */}
          <Grid size={6}>
            <Card>
              <CardHeader title="Top 10 Members by Scans" />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Member</TableCell>
                        <TableCell align="right">Scans</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboardData.map((entry, index) => (
                        <TableRow key={entry.memberId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{entry.name}</TableCell>
                          <TableCell align="right">{entry.scans}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Scans Bar Chart */}
          <Grid size={6}>
            <Card>
              <CardHeader title="Daily Scans Trend" />
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={scanData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="scans" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Redeems Line Chart */}
          <Grid size={6}>
            <Card>
              <CardHeader title="Daily Rewards Redeemed" />
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={rewardsRedeemedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rewards"
                      stroke="#ff7300"
                      name="Redeemed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Changelog Markdown Viewer */}
          <Grid size={6}>
            <Card>
              <CardHeader title="System Changelog" />
              <CardContent>
                <ReactMarkdown>{changelogText}</ReactMarkdown>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
