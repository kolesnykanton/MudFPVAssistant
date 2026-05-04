import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Link, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OsdCommandPanel from '../components/OsdCommandPanel';

const OSD_COMMANDS = [
  { key: 'enter',    label: 'Enter OSD',      left: 'center_left', right: 'up_center'    },
  { key: 'cal_gyro', label: 'Calibrate Gyro', left: 'up_left',     right: 'down_center'  },
  { key: 'cal_acc',  label: 'Calibrate ACC',  left: 'up_left',     right: 'down_center'  },
  { key: 'save',     label: 'Save',           left: 'down_left',   right: 'down_right'   },
  { key: 'set_1',    label: 'Profile 1',      left: 'down_left',   right: 'center_left'  },
  { key: 'set_2',    label: 'Profile 2',      left: 'down_left',   right: 'up_center'    },
  { key: 'set_3',    label: 'Profile 3',      left: 'down_left',   right: 'center_right' },
];

export default function Utilities() {
  return (
    <div style={{ margin: '16px' }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Stick Commands</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {OSD_COMMANDS.map(cmd => (
              <Box key={cmd.key} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
                <OsdCommandPanel command={cmd.label} leftSegment={cmd.left} rightSegment={cmd.right} />
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Configurators</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Link href="https://app.betaflight.com" target="_blank" rel="noreferrer">Betaflight Configurator</Link>
            <Link href="https://esc-configurator.com" target="_blank" rel="noreferrer">ESC Configurator</Link>
            <Link href="https://expresslrs.github.io/web-flasher/" target="_blank" rel="noreferrer">ELRS Web Flasher</Link>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
