import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Code, Stack, Title } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Box p="xl" maw={640} mx="auto">
        <Stack gap="md">
          <Title order={3}>Something went wrong</Title>
          <Alert color="red" variant="light" title={error.name || 'Error'}>
            {error.message || 'Unknown error'}
          </Alert>
          {error.stack && (
            <Code block style={{ maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {error.stack}
            </Code>
          )}
          <Button onClick={this.handleReload}>Reload</Button>
        </Stack>
      </Box>
    );
  }
}
