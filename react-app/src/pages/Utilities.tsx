import { Accordion, Anchor, Grid, Stack } from '@mantine/core';
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
      <Accordion defaultValue="stick-commands">
        <Accordion.Item value="stick-commands">
          <Accordion.Control>Stick Commands</Accordion.Control>
          <Accordion.Panel>
            <Grid>
              {OSD_COMMANDS.map(cmd => (
                <Grid.Col key={cmd.key} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <OsdCommandPanel
                    command={cmd.label}
                    leftSegment={cmd.left}
                    rightSegment={cmd.right}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="configurators">
          <Accordion.Control>Configurators</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs">
              <Anchor href="https://app.betaflight.com" target="_blank" rel="noreferrer">
                Betaflight Configurator
              </Anchor>
              <Anchor href="https://esc-configurator.com" target="_blank" rel="noreferrer">
                ESC Configurator
              </Anchor>
              <Anchor href="https://expresslrs.github.io/web-flasher/" target="_blank" rel="noreferrer">
                ELRS Web Flasher
              </Anchor>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
