/**
 * Main application entry point for the React-Admin reward management system.
 * Configures the admin dashboard, authentication, data providers, and all resources (CRUD interfaces).
 */
import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

// ======================
// Component Imports
// ======================
import { apiUrl } from './lib'; // Base API URL for the data provider
import { authProvider } from './authProvider'; // Handles user authentication
import { RewardLayout } from './Components/RewardLayout'; // Custom layout wrapper
import { Dashboard } from './Components/Dashboard'; // Default dashboard page
import { QrScannerCamera } from "./Components/QrScannerCamera"; // Camera-based QR scanner
import { QrScannerHandheld } from "./Components/QrScannerHandheld"; // Handheld QR scanner
import { ScanLogs } from './Components/ScanLogs'; // Logs of scanned QR codes
import { RedeemLogs } from "./Components/RedeemLogs"; // Logs of redeemed rewards
import { RewardLogin } from './Components/RewardLogin'; // Custom login page
// User/Reward CRUD components
import { SiteUserCreate, SiteUserEdit, SiteUserList } from "./Components/SiteUsers";
import { RewardTypesList, RewardTypesEdit, RewardTypesCreate } from './Components/RewardTypes';
import { MembersList, MembersEdit, MembersCreate } from './Components/Members';
import { PendingMembersList } from './Components/PendingMembers';
import { MemberTypesList, MemberTypesEdit, MemberTypesCreate } from './Components/MemberTypes';

// ======================
// Icon Imports (Material-UI)
// ======================
import {
  QrCode as QrCodeCameraIcon, // Icon for camera QR scanner
  QrCode2 as QrCodeHandheldIcon, // Icon for handheld QR scanner
  AddShoppingCart as ScanLogsIcon, // Icon for scan logs
  Group as MembersIcon, // Icon for members
  Grade as RewardTypesIcon, // Icon for reward types
  Loyalty as MemberTypesIcon, // Icon for member types
  Redeem as RedeemLogsIcon, // Icon for redeem logs
  AdminPanelSettings as SiteSiteUsersIcon, // Icon for site users
  Pending as PendingMembersIcon // Icon for pending members
} from '@mui/icons-material';

export const App = () => (
  <Admin
    authProvider={authProvider} // Authentication logic
    dashboard={Dashboard} // Default dashboard component
    dataProvider={simpleRestProvider(apiUrl)} // REST API data provider
    disableTelemetry={true} // Disables React-Admin analytics
    layout={RewardLayout} // Custom layout (e.g., app bar, menu)
    loginPage={RewardLogin} // Custom login page
  >
    {/* ====================== */}
    {/* Resource Definitions */}
    {/* ====================== */}
    {/* Each `Resource` maps to a CRUD interface for a specific entity. */}
    {/* QR Scanners */}
    <Resource name="qr_scanner_camera" options={{ label: 'QR Scanner Camera' }} list={QrScannerCamera} icon={QrCodeCameraIcon} />
    <Resource name="qr_scanner_handheld" options={{ label: 'QR Scanner Handheld' }} list={QrScannerHandheld} icon={QrCodeHandheldIcon} />

    {/* Logs */}
    <Resource name="scan_logs" options={{ label: 'Scan Logs' }} list={ScanLogs} icon={ScanLogsIcon} />
    <Resource name="redeem_logs" options={{ label: 'Redeem Logs' }} list={RedeemLogs} icon={RedeemLogsIcon} />

    {/* Member Management */}
    <Resource name="members" list={MembersList} edit={MembersEdit} create={MembersCreate} icon={MembersIcon} />
    <Resource name="pending_members" options={{ label: 'Pending Members' }} list={PendingMembersList} icon={PendingMembersIcon} />
    <Resource name="member_types" options={{ label: 'Member Types' }} list={MemberTypesList} edit={MemberTypesEdit} create={MemberTypesCreate} icon={MemberTypesIcon} />

    {/* Reward Management */}
    <Resource name="reward_types" options={{ label: 'Reward Types' }} list={RewardTypesList} edit={RewardTypesEdit} create={RewardTypesCreate} icon={RewardTypesIcon} />

    {/* Admin/Site Users */}
    <Resource name="site_users" options={{ label: 'Site Users' }} list={SiteUserList} edit={SiteUserEdit} create={SiteUserCreate} icon={SiteSiteUsersIcon} />
  </Admin>
);
