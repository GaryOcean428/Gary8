'use client';

import { Layout } from '../components/layout/Layout';
import type { ActivePanel } from '../types';
import { useState } from 'react';

export default function Home() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');

  return (
    <Layout activePanel={activePanel} onPanelChange={setActivePanel}>
      {/* Content will be rendered by Layout based on activePanel */}
    </Layout>
  );
}
