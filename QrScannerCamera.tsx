/**
 * QR Code Scanner Component with Camera Interface
 * 
 * Features:
 * - Real-time QR code scanning using device camera
 * - Member recognition and point tracking
 * - Reward eligibility calculation
 * - Automatic dialog timeout
 * - Database synchronization for scans and rewards
 */

import { useCallback, useEffect, useState } from "react";
import { useDataProvider, useNotify } from "react-admin";
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

// Type definition for dialog content
interface DialogContentData {
  memberType: string;
  memberName: string;
  points: number;
  scansRequiredForReward: number;
}

export const QrScannerCamera = () => {
  const notify = useNotify();
  const dataProvider = useDataProvider();

  // ======================
  // State Management
  // ======================
  const [openDialog, setOpenDialog] = useState(false); // Controls dialog visibility
  const [timer, setTimer] = useState(30); // Countdown timer for auto-closing dialog
  const [scanningPaused, setScanningPaused] = useState(false); // Pauses scanner during processing
  const [rewardDueState, setRewardDueState] = useState(false); // Tracks reward eligibility
  const [dialogContent, setDialogContent] = useState<DialogContentData | null>(null); // Dialog display data

  // ======================
  // Dialog Handlers
  // ======================
  /**
   * Resets scanner state and closes dialog
   * Reloads window to ensure clean scanner restart
   */
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setScanningPaused(false);
    setTimer(30);
    setDialogContent(null);
    window.location.reload();
  }, []);

  // Auto-close dialog when timer reaches 0
  useEffect(() => {
    if (timer === 0 && openDialog) {
      handleCloseDialog();
    }
  }, [timer, openDialog, handleCloseDialog]);

  // Timer effect for dialog auto-close
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (openDialog && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [openDialog, timer]);

  // ======================
  // Core Scanning Logic
  // ======================
  /**
   * Processes scanned QR code and updates member data
   * @param qrCode - Scanned QR code value
   * @returns Dialog content data or null if error occurs
   */
  const processQrScan = async (qrCode: string) => {
    try {
      // 1. Fetch member by QR code
      const { data: members } = await dataProvider.getList('members', {
        pagination: { page: 1, perPage: 1 },
        sort: { field: 'id', order: 'ASC' },
        filter: { qr_code: qrCode }
      });

      if (members.length === 0) {
        notify('No member found with this QR code', { type: 'error' });
        return null;
      }
      const member = members[0];

      // 2. Fetch member type details
      const { data: memberType } = await dataProvider.getOne('member_types', { id: member.member_type_id });

      if (!memberType) {
        notify('No Member Type found for this member', { type: 'warning' });
        return null;
      }

      // 3. Calculate points and reward status
      const newMemberPoints = member.points + 1;
      const newPointsToReward = memberType.scans_required - newMemberPoints;
      const now = new Date().toISOString();
      const rewardDue = newPointsToReward <= 0;

      // 4. Prepare member update payload
      const memberUpdateData = {
        ...member,
        total_scans: member.total_scans + 1,
        points: rewardDue ? 0 : newMemberPoints, // Reset if reward earned
        points_to_reward: newPointsToReward,
        reward_due: rewardDue,
        reward_earned_at: rewardDue && !member.reward_earned_at ? now : member.reward_earned_at,
        last_scan_at: now,
      };

      // 5. Update database records
      await dataProvider.update('members', {
        id: member.id,
        previousData: member,
        data: memberUpdateData,
      });

      await dataProvider.update('member_types', {
        id: memberType.id,
        previousData: memberType,
        data: {
          ...memberType,
          total_scans: memberType.total_scans + 1,
        }
      });

      // 6. Create scan log
      await dataProvider.create('scan_logs', {
        data: { scanned_value: qrCode }
      });

      // 7. Create redeem log if reward earned
      if (rewardDue) {
        await dataProvider.create('redeem_logs', {
          data: {
            member_id: member.id,
            reward_type_id: memberType.reward_type_id,
          }
        });
      }

      // Return data for dialog display
      return {
        memberType: memberType.name,
        memberName: member.name,
        points: rewardDue ? 0 : newMemberPoints,
        scansRequiredForReward: memberType.scans_required
      };
    } catch (error) {
      const msg = 'Error processing QR scan, account may have just been scanned.';
      console.error(msg, error);
      notify(msg, { type: 'error' });
      return null;
    }
  };

  /**
   * Handles detected QR codes
   * @param data - Array of detected barcodes
   */
  const handleScan = async (data: IDetectedBarcode[]) => {
    if (scanningPaused || !data) return;

    setScanningPaused(true);
    const qrCode = String(data[0].rawValue);

    const dialogData = await processQrScan(qrCode);

    if (dialogData) {
      setDialogContent(dialogData);
      setOpenDialog(true);
      setRewardDueState(dialogData.points === 0);
      setTimer(30);
      notify('Visit logged successfully', { type: 'success' });
    } else {
      setScanningPaused(false); // Resume scanning if error occurs
    }
  };

  // ======================
  // Render
  // ======================
  return (
    <Box sx={{ width: '75%', height: '75%' }}>
      {/* QR Scanner Component */}
      <Scanner
        onScan={(result) => handleScan(result)}
        scanDelay={10000} // 10 second scan delay
        paused={scanningPaused}
      />

      {/* Results Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        {rewardDueState && (
          <DialogTitle>
            🥳 Congratulations, you are due a reward! 🥳
          </DialogTitle>
        )}
        <DialogContent>
          {dialogContent && (
            <>
              <Typography variant="h6">
                Successful scan for {dialogContent.memberName}!
              </Typography>
              <Typography variant="subtitle1">
                Member Type: {dialogContent.memberType}
              </Typography>
              <Typography>
                Progress: {dialogContent.points} / {dialogContent.scansRequiredForReward} <br />
                {dialogContent.scansRequiredForReward - dialogContent.points} more scans needed for reward!
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                <CircularProgress variant="determinate" value={(timer / 30) * 100} />
                <Typography>
                  Dialog box will automatically close in {timer} seconds
                </Typography>
              </Box>
              <Button onClick={handleCloseDialog} variant="contained" sx={{ mt: 2 }}>
                Close and Resume Scanning
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
