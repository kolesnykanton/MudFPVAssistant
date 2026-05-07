import { Accordion, Anchor, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
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
    <Container size="xl" px="md" py="md">
      <Title order={2} mb="sm">Utilities</Title>
      <Text size="sm" c="dimmed" mb="md">
        Stick command reference cards are optimized for mobile and desktop viewing.
      </Text>
      <Accordion defaultValue="stick-commands">
        <Accordion.Item value="stick-commands">
          <Accordion.Control>Stick Commands</Accordion.Control>
          <Accordion.Panel>
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, xl: 4 }} spacing="md" verticalSpacing="md">
              {OSD_COMMANDS.map(cmd => (
                <OsdCommandPanel
                  key={cmd.key}
                  command={cmd.label}
                  leftSegment={cmd.left}
                  rightSegment={cmd.right}
                />
              ))}
            </SimpleGrid>
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
    </Container>
  );
}
