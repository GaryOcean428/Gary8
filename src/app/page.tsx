'use client';

import { Layout } from '../components/layout/Layout';
import type { ActivePanel } from '../types';
import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingOverlay } from '../components/common/LoadingOverlay';

export default function Home() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');

  return (
    <ErrorBoundary>
      <Layout activePanel={activePanel} onPanelChange={setActivePanel}>
        <LoadingOverlay />
        {/* Content will be rendered by Layout based on activePanel */}
      </Layout>
    </ErrorBoundary>
  );
}
